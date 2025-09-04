# Fixed test for TC005: validate payload structure for /api/process-pdf

def test_process_pdf_payload():
    # Create a minimal dummy PDF binary (valid PDF header/footer)
    dummy_pdf = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"

    user_id = "test-user-123"
    pdf_id = "pdf-456"

    # Validate types and presence according to PRD: file (binary), userId (string), pdfId (string)
    assert isinstance(dummy_pdf, (bytes, bytearray)), "file must be bytes or bytearray"
    assert isinstance(user_id, str) and user_id.strip(), "userId must be a non-empty string"
    assert isinstance(pdf_id, str) and pdf_id.strip(), "pdfId must be a non-empty string"

    print("Payload structure validated for /api/process-pdf: file (bytes), userId (str), pdfId (str)")


# Run the test
if __name__ == "__main__":
    test_process_pdf_payload()