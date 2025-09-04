import io

def test_process_pdf_payload():
    # Create a minimal fake PDF binary to simulate an uploaded file
    pdf_bytes = b'%PDF-1.4\n%Fake PDF\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'

    # Prepare multipart/form-data parts according to PRD: file (binary), userId (string), pdfId (string)
    files = {'file': ('test.pdf', io.BytesIO(pdf_bytes), 'application/pdf')}
    data = {'userId': 'user-123', 'pdfId': 'pdf-abc'}

    # Assertions to validate payload structure and types match PRD
    assert 'file' in files, "Missing 'file' in files payload"

    filename, fileobj, content_type = files['file']
    assert isinstance(filename, str), "Filename must be a string"
    assert hasattr(fileobj, 'read'), "File object must be file-like and support read()"
    assert content_type == 'application/pdf', "Content type must be 'application/pdf'"

    assert 'userId' in data, "Missing 'userId' in form data"
    assert isinstance(data['userId'], str), "userId must be a string"

    assert 'pdfId' in data, "Missing 'pdfId' in form data"
    assert isinstance(data['pdfId'], str), "pdfId must be a string"

    # If all assertions pass, print a confirmation
    print('Payload structure for /api/process-pdf is valid.')

# Call the test function
test_process_pdf_payload()