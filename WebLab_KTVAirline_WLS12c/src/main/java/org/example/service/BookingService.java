package org.example.service;

import org.example.payload.BookingRequest;
import org.example.payload.BookingResponse;

import java.util.Map;

public interface BookingService {
    public BookingResponse quote(BookingRequest request);

    public BookingResponse quote(BookingRequest request, Integer userId);

    public BookingResponse hold(BookingRequest request, Integer userId);

    public BookingResponse applyPromotion(BookingRequest request, Integer userId);

    public BookingResponse confirm(BookingRequest request, Integer userId);

    public byte[] saveDraft(BookingRequest request);
    /*
     * FIXED CODE:
     *
     * Replace the native-serialization save signature above with:
     *
     * public BookingRequest saveDraft(BookingRequest request);
     */

    public Map<String, Object> importDraft(byte[] draftBytes);

    public Map<String, Object> importDraft(byte[] draftBytes, Integer userId);

    /*
     * FIXED CODE:
     *
     * Remove the byte[] import signatures above and keep this JSON DTO import
     * signature:
     *
     * public Map<String, Object> importDraft(BookingRequest draft, Integer userId);
     */
}
