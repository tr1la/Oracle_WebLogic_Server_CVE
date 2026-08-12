package org.example.serviceImpl;

import org.example.constant.PromotionDiscountType;
import org.example.constant.SeatType;
import org.example.entity.Promotion;
import org.example.repository.PromotionRepository;
import org.example.service.PromotionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.beans.XMLDecoder;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class PromotionServiceImpl implements PromotionService {
    private static final Logger logger = LoggerFactory.getLogger(PromotionServiceImpl.class);

    @Autowired
    PromotionRepository promotionRepository;

    @Value("${app.promotion-import-dir:imports/promotions}")
    private String importDir;

    @Override
    public List<Promotion> findAll(Pageable pageable) {
        return promotionRepository.findByIsDeletedFalse(pageable).getContent();
    }

    @Override
    public List<Promotion> findByCode(String code, Pageable pageable) {
        return promotionRepository.findByCodeContainsAndIsDeletedFalse(code, pageable).getContent();
    }

    @Override
    public List<Promotion> findByTitle(String title, Pageable pageable) {
        return promotionRepository.findByTitleContainsAndIsDeletedFalse(title, pageable).getContent();
    }

    @Override
    public List<Promotion> findByActive(Boolean active, Pageable pageable) {
        return promotionRepository.findByActiveAndIsDeletedFalse(active, pageable).getContent();
    }

    @Override
    public List<Promotion> findBySeatType(SeatType seatType, Pageable pageable) {
        return promotionRepository.findBySeatTypeAndIsDeletedFalse(seatType, pageable).getContent();
    }

    @Override
    public Promotion findById(Integer id) {
        return promotionRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public Promotion save(Promotion promotion) {
        applyDefaults(promotion);
        return promotionRepository.save(promotion);
    }

    @Override
    public Promotion importPromotion(Promotion promotion) {
        Promotion existingPromotion = null;
        if (promotion.getCode() != null) {
            existingPromotion = promotionRepository.findByCodeAndIsDeletedFalse(promotion.getCode());
        }

        if (existingPromotion != null) {
            promotion.setId(existingPromotion.getId());
            promotion.setCreateBy(existingPromotion.getCreateBy());
            promotion.setCreateDate(existingPromotion.getCreateDate());
            promotion.setDeleted(existingPromotion.isDeleted());
        }

        applyDefaults(promotion);
        return promotionRepository.save(promotion);
    }

    @Override
    public Map<String, String> queuePromotionXml(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Promotion XML file is required");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename is required");
        }

        String safeFilename = Paths.get(originalFilename).getFileName().toString();
        if (!safeFilename.toLowerCase().endsWith(".xml")) {
            throw new IllegalArgumentException("Only XML promotion files are allowed");
        }

        Path promotionDir = Paths.get(importDir).toAbsolutePath().normalize();
        Files.createDirectories(promotionDir);

        Path destination = promotionDir.resolve(safeFilename).normalize();
        Path uploadingFile = promotionDir.resolve(safeFilename + ".uploading").normalize();

        /*
         * XXE/XMLDecoder queue fix:
         * The importer should only process files created by a trusted queue path.
         * Do not let a client-controlled filename decide the final queued file,
         * and do not return absolute filesystem paths to the client.
         *
         * FIXED CODE:
         *
         * boolean useSafePromotionQueue = true;
         * if (useSafePromotionQueue) {
         * String queuedFilename = java.util.UUID.randomUUID() + ".xml";
         * Path fixedDestination = promotionDir.resolve(queuedFilename).normalize();
         * if (!fixedDestination.startsWith(promotionDir)) {
         * throw new IllegalArgumentException("Invalid promotion import path");
         * }
         *
         * file.transferTo(fixedDestination.toFile());
         * return Map.of("status", "QUEUED", "fileName", queuedFilename);
         * }
         */
        file.transferTo(uploadingFile.toFile());
        Files.move(uploadingFile, destination, StandardCopyOption.REPLACE_EXISTING);
        importPromotionXmlFiles();
        Map<String, String> result = new LinkedHashMap<>();
        result.put("status", "QUEUED");
        result.put("fileName", safeFilename);
        result.put("path", destination.toString());
        return result;
    }

    public void importPromotionXmlFiles() {
        Path promotionDir = Paths.get(importDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(promotionDir);
        } catch (IOException e) {
            logger.warn("Could not create promotion import directory {}", promotionDir, e);
            return;
        }

        try (DirectoryStream<Path> files = Files.newDirectoryStream(promotionDir, "*.{xml,XML}")) {
            for (Path xmlFile : files) {
                importPromotionXml(xmlFile);
            }
        } catch (IOException e) {
            logger.warn("Could not scan promotion import directory {}", promotionDir, e);
        }
    }

    private void importPromotionXml(Path xmlFile) {

        boolean useSafePromotionXmlParser = true;
        if (useSafePromotionXmlParser) {
            try {
                Promotion promotion = parsePromotionXmlSafely(xmlFile);
                Promotion savedPromotion = importPromotion(promotion);
                logger.info("Imported promotion XML {} as promotion {}",
                        xmlFile.getFileName(), savedPromotion.getCode());
                moveToProcessed(xmlFile);
            } catch (Exception e) {
                logger.warn("Failed to import promotion XML {}", xmlFile.getFileName(), e);
            }
            return;
        }

    }

    private Promotion parsePromotionXmlSafely(Path xmlFile) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl",
                true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities",
                false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities",
                false);
        factory.setFeature(
                "http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");

        Document document = factory.newDocumentBuilder().parse(xmlFile.toFile());
        Element root = document.getDocumentElement();
        if (root == null || !"promotion".equals(root.getTagName())) {
            throw new IllegalArgumentException("Invalid promotion XML root");
        }

        Promotion promotion = new Promotion();
        promotion.setCode(requiredText(root, "code"));
        promotion.setTitle(requiredText(root, "title"));
        promotion.setDescription(optionalText(root, "description"));
        promotion.setDeparture(optionalText(root, "departure"));
        promotion.setDepartureCode(optionalText(root, "departureCode"));
        promotion.setArrival(optionalText(root, "arrival"));
        promotion.setArrivalCode(optionalText(root, "arrivalCode"));
        promotion.setSeatType(optionalSeatType(root, "seatType"));
        promotion.setDiscountType(optionalDiscountType(root, "discountType"));
        promotion.setDiscountValue(optionalBigDecimal(root, "discountValue"));
        promotion.setMinimumOrderAmount(optionalBigDecimal(root,
                "minimumOrderAmount"));
        promotion.setMaximumDiscountAmount(optionalBigDecimal(root,
                "maximumDiscountAmount"));
        promotion.setStartDate(requiredSqlDate(root, "startDate"));
        promotion.setEndDate(requiredSqlDate(root, "endDate"));
        promotion.setUsageLimit(optionalInteger(root, "usageLimit"));
        promotion.setUsedCount(optionalInteger(root, "usedCount"));
        promotion.setActive(optionalBoolean(root, "active"));
        promotion.setPictureLink(optionalText(root, "pictureLink"));
        promotion.setTerms(optionalText(root, "terms"));
        return promotion;
    }

    private String requiredText(Element root, String tagName) {
        String value = optionalText(root, tagName);
        if (value == null) {
            throw new IllegalArgumentException("Missing required promotion field: " + tagName);
        }
        return value;
    }

    private String optionalText(Element root, String tagName) {
        NodeList nodes = root.getElementsByTagName(tagName);
        if (nodes.getLength() == 0) {
            return null;
        }
        String value = nodes.item(0).getTextContent();
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private BigDecimal optionalBigDecimal(Element root, String tagName) {
        String value = optionalText(root, tagName);
        return value == null ? null : new BigDecimal(value);
    }

    private Integer optionalInteger(Element root, String tagName) {
        String value = optionalText(root, tagName);
        return value == null ? null : Integer.valueOf(value);
    }

    private Boolean optionalBoolean(Element root, String tagName) {
        String value = optionalText(root, tagName);
        return value == null ? null : Boolean.valueOf(value);
    }

    private java.sql.Date requiredSqlDate(Element root, String tagName) {
        String value = requiredText(root, tagName);
        return java.sql.Date.valueOf(value);
    }

    private PromotionDiscountType optionalDiscountType(Element root, String tagName) {
        String value = optionalText(root, tagName);
        return value == null ? null : PromotionDiscountType.valueOf(value.toUpperCase(Locale.ROOT));
    }

    private SeatType optionalSeatType(Element root, String tagName) {
        String value = optionalText(root, tagName);
        return value == null ? null : SeatType.valueOf(value.toUpperCase(Locale.ROOT));
    }

    private void moveToProcessed(Path xmlFile) throws IOException {
        Path processedDir = xmlFile.getParent().resolve("processed");
        Files.createDirectories(processedDir);
        Files.move(xmlFile, processedDir.resolve(xmlFile.getFileName()), StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public void delete(Integer id) {
        Promotion promotion = promotionRepository.findByIdAndIsDeletedFalse(id);
        promotion.setDeleted(true);
        promotionRepository.save(promotion);
    }

    private void applyDefaults(Promotion promotion) {
        if (promotion.getActive() == null) {
            promotion.setActive(true);
        }
        if (promotion.getUsedCount() == null) {
            promotion.setUsedCount(0);
        }
        if (promotion.getDiscountType() == null) {
            promotion.setDiscountType(PromotionDiscountType.PERCENTAGE);
        }
        if (promotion.getDiscountValue() == null) {
            promotion.setDiscountValue(BigDecimal.ZERO);
        }
    }
}
