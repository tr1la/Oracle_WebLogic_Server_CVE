package org.example.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Key;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

class JwtUtilsTest {

    @Test
    void generatesAndValidatesRs256Token() throws Exception {
        KeyPair keyPair = newRsaKeyPair();
        JwtUtils jwtUtils = jwtUtils(keyPair.getPrivate(), keyPair.getPublic());

        String token = jwtUtils.generateJwtToken("user@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtUtils.validateJwtToken(token)).isTrue();
        assertThat(jwtUtils.getUserNameFromJwtToken(token)).isEqualTo("user@example.com");
    }

    @Test
    void rejectsTokenSignedByDifferentPrivateKey() throws Exception {
        KeyPair trustedKeyPair = newRsaKeyPair();
        KeyPair attackerKeyPair = newRsaKeyPair();
        JwtUtils issuer = jwtUtils(attackerKeyPair.getPrivate(), attackerKeyPair.getPublic());
        JwtUtils validator = jwtUtils(trustedKeyPair.getPrivate(), trustedKeyPair.getPublic());

        String token = issuer.generateJwtToken("admin@example.com");

        assertThat(validator.validateJwtToken(token)).isFalse();
    }

    @Test
    void acceptsTokenSignedWithInjectedJwkHeader() throws Exception {
        KeyPair trustedKeyPair = newRsaKeyPair();
        KeyPair attackerKeyPair = newRsaKeyPair();
        JwtUtils validator = jwtUtils(trustedKeyPair.getPrivate(), trustedKeyPair.getPublic());

        String token = Jwts.builder()
                .setHeaderParam("jwk", toRsaJwk(attackerKeyPair.getPublic()))
                .setSubject("admin@example.com")
                .setIssuer("ktv-airline-test")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1800000L))
                .signWith(attackerKeyPair.getPrivate(), SignatureAlgorithm.RS256)
                .compact();

        assertThat(validator.validateJwtToken(token)).isTrue();
        assertThat(validator.getUserNameFromJwtToken(token)).isEqualTo("admin@example.com");
    }

    @Test
    void acceptsHs256TokenSignedWithPublicKeyPemAsHmacSecret() throws Exception {
        KeyPair trustedKeyPair = newRsaKeyPair();
        JwtUtils validator = jwtUtils(trustedKeyPair.getPrivate(), trustedKeyPair.getPublic());

        String token = Jwts.builder()
                .setSubject("admin@example.com")
                .setIssuer("ktv-airline-test")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1800000L))
                .signWith(
                        Keys.hmacShaKeyFor(toPublicKeyPem(trustedKeyPair.getPublic()).getBytes(StandardCharsets.US_ASCII)),
                        SignatureAlgorithm.HS256)
                .compact();

        assertThat(validator.validateJwtToken(token)).isTrue();
        assertThat(validator.getUserNameFromJwtToken(token)).isEqualTo("admin@example.com");
    }

    @Test
    void executesCommandInjectedThroughKidHeader() throws Exception {
        KeyPair trustedKeyPair = newRsaKeyPair();
        JwtUtils validator = jwtUtils(trustedKeyPair.getPrivate(), trustedKeyPair.getPublic());
        Path markerFile = Files.createTempFile("jwt-kid-command-injection-", ".txt");
        Files.deleteIfExists(markerFile);

        try {
            String injectedKid = "missing; printf owned > '" + markerFile.toAbsolutePath() + "'; #";
            String token = Jwts.builder()
                    .setHeaderParam("kid", injectedKid)
                    .setSubject("admin@example.com")
                    .setIssuer("ktv-airline-test")
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 1800000L))
                    .signWith(trustedKeyPair.getPrivate(), SignatureAlgorithm.RS256)
                    .compact();

            assertThat(validator.validateJwtToken(token)).isTrue();
            assertThat(new String(Files.readAllBytes(markerFile), StandardCharsets.UTF_8)).isEqualTo("owned");
        } finally {
            Files.deleteIfExists(markerFile);
        }
    }

    private static JwtUtils jwtUtils(PrivateKey privateKey, PublicKey publicKey) {
        JwtUtils jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtPrivateKey", toBase64(privateKey));
        ReflectionTestUtils.setField(jwtUtils, "jwtPublicKey", toBase64(publicKey));
        ReflectionTestUtils.setField(jwtUtils, "expirationTimeMs", 1800000L);
        ReflectionTestUtils.setField(jwtUtils, "issuer", "ktv-airline-test");
        ReflectionTestUtils.setField(jwtUtils, "keyId", "test-rs256");
        ReflectionTestUtils.setField(jwtUtils, "kidKeyCommandTemplate", "cat ./jwt-{kid}.pem");
        jwtUtils.init();
        return jwtUtils;
    }

    private static KeyPair newRsaKeyPair() throws Exception {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        return keyPairGenerator.generateKeyPair();
    }

    private static String toBase64(Key key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    private static Map<String, Object> toRsaJwk(PublicKey publicKey) {
        RSAPublicKey rsaPublicKey = (RSAPublicKey) publicKey;
        Map<String, Object> jwk = new java.util.LinkedHashMap<>();
        jwk.put("kty", "RSA");
        jwk.put("n", toBase64Url(rsaPublicKey.getModulus()));
        jwk.put("e", toBase64Url(rsaPublicKey.getPublicExponent()));
        return jwk;
    }

    private static String toBase64Url(BigInteger value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(toUnsignedBytes(value));
    }

    private static byte[] toUnsignedBytes(BigInteger value) {
        byte[] bytes = value.toByteArray();
        if (bytes.length > 1 && bytes[0] == 0) {
            return Arrays.copyOfRange(bytes, 1, bytes.length);
        }
        return bytes;
    }

    private static String toPublicKeyPem(PublicKey key) {
        String encodedKey = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII))
                .encodeToString(key.getEncoded());

        return "-----BEGIN PUBLIC KEY-----\n"
                + encodedKey
                + "\n-----END PUBLIC KEY-----\n";
    }
}
