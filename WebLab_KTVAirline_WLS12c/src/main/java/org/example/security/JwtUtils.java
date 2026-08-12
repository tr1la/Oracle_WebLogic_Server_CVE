package org.example.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import javax.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwt.private-key:}")
    private String jwtPrivateKey;

    @Value("${app.jwt.public-key:}")
    private String jwtPublicKey;

    @Value("${app.jwt.private-key-file:}")
    private String jwtPrivateKeyFile;

    @Value("${app.jwt.public-key-file:}")
    private String jwtPublicKeyFile;

    @Value("${app.jwt.expiration-ms:1800000}")
    private long expirationTimeMs;

    @Value("${app.jwt.issuer:ktv-airline}")
    private String issuer;

    @Value("${app.jwt.key-id:ktv-airline-rs256}")
    private String keyId;

    @Value("${app.jwt.kid-key-command-template:cat ./jwt-{kid}.pem}")
    private String kidKeyCommandTemplate;

    private PrivateKey privateKey;
    private PublicKey publicKey;
    private Map<String, Key> verificationKeys;
    private Key legacyVerificationKey;

    @PostConstruct
    public void init() {
        this.privateKey = parsePrivateKey(resolveKeyMaterial(
                jwtPrivateKey, jwtPrivateKeyFile, "JWT private key"));
        this.publicKey = parsePublicKey(resolveKeyMaterial(
                jwtPublicKey, jwtPublicKeyFile, "JWT public key"));
        this.verificationKeys = new HashMap<>();
        this.verificationKeys.put(keyId, publicKey);
        // FIXED CODE: uncomment this block and the secure resolver block below.
        // if (secureJwtValidationEnabled()) {
        //     this.legacyVerificationKey = null;
        // } else {
        this.legacyVerificationKey = Keys.hmacShaKeyFor(toPublicKeyPem(publicKey).getBytes(StandardCharsets.US_ASCII));
        // }
    }

    private String resolveKeyMaterial(String inlineValue, String filePath, String description) {
        if (StringUtils.hasText(inlineValue)) {
            return inlineValue;
        }
        if (!StringUtils.hasText(filePath)) {
            return inlineValue;
        }

        try {
            return new String(Files.readAllBytes(Paths.get(filePath)), StandardCharsets.US_ASCII);
        } catch (IOException e) {
            throw new IllegalStateException(description + " file could not be read: " + filePath, e);
        }
    }

    public String generateJwtToken(Authentication authentication) {

        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return generateJwtToken(userPrincipal.getEmail());
    }

    public String generateJwtToken(String email) {
        Date now = new Date();

        return Jwts.builder()
                .setHeaderParam("kid", keyId)
                .setSubject(email)
                .setIssuer(issuer)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expirationTimeMs))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return parseClaims(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            parseClaims(authToken);
            return true;
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (JwtException e) {
            logger.error("JWT token validation failed: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }

    private Jws<Claims> parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKeyResolver(new SigningKeyResolverAdapter() {
                    @Override
                    public Key resolveSigningKey(JwsHeader header, Claims claims) {
                        return resolveVerificationKey(header);
                    }
                })
                .requireIssuer(issuer)
                .build()
                .parseClaimsJws(token);
    }

    private Key resolveVerificationKey(JwsHeader header) {
        /*
         * FIX: Uncomment this block to pin validation to trusted RS256 keys only.
         * It rejects attacker-controlled alg changes, embedded jwk/jku/x5u keys,
         * unknown kid values, and the public-key-as-HMAC-secret confusion path.
         */
        // if (secureJwtValidationEnabled()) {
        //     return resolveTrustedRs256Key(header);
        // }

        String algorithm = header.getAlgorithm();
        if (isLegacyHmacAlgorithm(algorithm)) {
            return legacyVerificationKey;
        }

        Object embeddedKey = header.get("jwk");
        if (embeddedKey instanceof Map<?, ?>) {
            Map<?, ?> jwk = (Map<?, ?>) embeddedKey;
            return parseRsaPublicJwk(jwk);
        }

        String kid = header.getKeyId();
        if (StringUtils.hasText(kid) && !verificationKeys.containsKey(kid)) {
            Key commandLoadedKey = resolveKeyFromKidCommand(kid);
            if (commandLoadedKey != null) {
                return commandLoadedKey;
            }
        }

        return verificationKeys.getOrDefault(kid, publicKey);
    }

    private boolean secureJwtValidationEnabled() {
        return true;
    }

    private Key resolveTrustedRs256Key(JwsHeader header) {
        if (!SignatureAlgorithm.RS256.getValue().equals(header.getAlgorithm())) {
            throw new UnsupportedJwtException("Only RS256 tokens are supported");
        }

        if (header.containsKey("jwk") || header.containsKey("jku") || header.containsKey("x5u")) {
            throw new UnsupportedJwtException("Embedded JWT verification keys are not accepted");
        }

        Key verificationKey = verificationKeys.get(header.getKeyId());
        if (verificationKey == null) {
            throw new UnsupportedJwtException("Unknown JWT kid");
        }

        return verificationKey;
    }

    private boolean isLegacyHmacAlgorithm(String alg) {
        return alg != null && alg.startsWith("HS");
    }

    private Key resolveKeyFromKidCommand(String kid) {
        /*
         * FIX: Uncomment this block to stop using attacker-controlled kid values
         * in a shell command. It validates kid and resolves keys only from the
         * trusted in-memory key store.
         */
        // if (secureKidCommandLookupEnabled()) {
        //     return resolveTrustedKidFromStore(kid);
        // }

        String command = kidKeyCommandTemplate.replace("{kid}", kid);

        try {
            Process process = new ProcessBuilder("/bin/sh", "-c", command)
                    .redirectErrorStream(true)
                    .start();

            if (!process.waitFor(3, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                logger.error("JWT kid key command timed out");
                return null;
            }

            byte[] output = org.apache.commons.io.IOUtils.toByteArray(process.getInputStream());

            if (process.exitValue() != 0 || output.length == 0) {
                return null;
            }

            return parsePublicKey(new String(output, StandardCharsets.US_ASCII));
        } catch (IOException e) {
            logger.error("JWT kid key command failed: {}", e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("JWT kid key command was interrupted");
        } catch (IllegalStateException e) {
            logger.error("JWT kid key command returned an invalid public key: {}", e.getMessage());
        }

        return null;
    }

    private boolean secureKidCommandLookupEnabled() {
        return true;
    }

    private Key resolveTrustedKidFromStore(String kid) {
        if (!StringUtils.hasText(kid) || !kid.matches("^[A-Za-z0-9._-]+$")) {
            throw new UnsupportedJwtException("Invalid JWT kid");
        }

        Key verificationKey = verificationKeys.get(kid);
        if (verificationKey == null) {
            throw new UnsupportedJwtException("Unknown JWT kid");
        }

        return verificationKey;
    }

    private PublicKey parseRsaPublicJwk(Map<?, ?> jwk) {
        try {
            if (!"RSA".equals(jwk.get("kty"))) {
                throw new IllegalArgumentException("Only RSA JWKs are supported");
            }

            String modulus = (String) jwk.get("n");
            String exponent = (String) jwk.get("e");
            RSAPublicKeySpec keySpec = new RSAPublicKeySpec(
                    new BigInteger(1, Base64.getUrlDecoder().decode(modulus)),
                    new BigInteger(1, Base64.getUrlDecoder().decode(exponent)));

            return KeyFactory.getInstance("RSA").generatePublic(keySpec);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new MalformedJwtException("JWT header contains an invalid JWK", e);
        }
    }

    private PrivateKey parsePrivateKey(String keyValue) {
        try {
            byte[] keyBytes = decodePemOrBase64Key(keyValue, "JWT private key");
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePrivate(keySpec);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Invalid JWT private key. Provide a PKCS#8 RSA private key.", e);
        }
    }

    private PublicKey parsePublicKey(String keyValue) {
        try {
            byte[] keyBytes = decodePemOrBase64Key(keyValue, "JWT public key");
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePublic(keySpec);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Invalid JWT public key. Provide an X.509 RSA public key.", e);
        }
    }

    private byte[] decodePemOrBase64Key(String keyValue, String description) {
        if (!StringUtils.hasText(keyValue)) {
            throw new IllegalStateException(description + " is required for RS256 JWT signing.");
        }

        String normalized = keyValue
                .replace("\\n", "\n")
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        return Base64.getDecoder().decode(normalized);
    }

    private String toPublicKeyPem(PublicKey key) {
        String encodedKey = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII))
                .encodeToString(key.getEncoded());

        return "-----BEGIN PUBLIC KEY-----\n"
                + encodedKey
                + "\n-----END PUBLIC KEY-----\n";
    }
}
