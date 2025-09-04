import io
import requests


def test_process_pdf_api():
    url = "http://localhost:3000/api/process-pdf"

    # Minimal valid-looking PDF bytes (not a full PDF, but valid for upload as binary)
    pdf_bytes = b"%PDF-1.4\n%EOF\n"

    files = {
        'file': ('test.pdf', io.BytesIO(pdf_bytes), 'application/pdf')
    }

    data = {
        'userId': 'test-user-123',
        'pdfId': 'pdf-123'
    }

    resp = requests.post(url, files=files, data=data)

    # Expecting 200 as per PRD
    assert resp.status_code == 200, f"Expected status 200, got {resp.status_code}. Response body: {resp.text}"

    try:
        j = resp.json()
    except ValueError:
        assert False, f"Response is not valid JSON: {resp.text}"

    # Validate top-level fields
    assert 'success' in j and isinstance(j['success'], bool), "Missing or invalid 'success' boolean"
    assert 'data' in j and isinstance(j['data'], dict), "Missing or invalid 'data' object"

    data_obj = j['data']

    # Validate expected data fields per PRD
    assert 'questionsExtracted' in data_obj and isinstance(data_obj['questionsExtracted'], int), "Missing or invalid 'questionsExtracted'"
    assert 'questionsStored' in data_obj and isinstance(data_obj['questionsStored'], int), "Missing or invalid 'questionsStored'"
    assert 'processingTime' in data_obj and isinstance(data_obj['processingTime'], int), "Missing or invalid 'processingTime'"
    assert 'pdfId' in data_obj and isinstance(data_obj['pdfId'], str), "Missing or invalid 'pdfId'"

    # Ensure returned pdfId matches what we sent
    assert data_obj['pdfId'] == data['pdfId'], f"Returned pdfId '{data_obj['pdfId']}' does not match sent pdfId '{data['pdfId']}'"


if __name__ == '__main__':
    test_process_pdf_api()
