import requests

def test_process_pdf():
    url = 'http://localhost:3000/api/process-pdf'

    # Minimal PDF-like payload; server should accept multipart file input
    files = {
        'file': ('test.pdf', b'%PDF-1.4\n%Test PDF content\n', 'application/pdf')
    }
    data = {
        'userId': 'test-user-123',
        'pdfId': 'pdf-abc-123'
    }

    resp = requests.post(url, files=files, data=data, timeout=30)

    # Expecting 200 OK per PRD for successful processing
    assert resp.status_code == 200, f'Expected status 200, got {resp.status_code}. Response body: {resp.text}'

    try:
        j = resp.json()
    except ValueError:
        assert False, f'Response is not valid JSON: {resp.text}'

    # Validate top-level structure
    assert 'success' in j and isinstance(j['success'], bool), "Missing 'success' boolean in response"
    assert 'data' in j and isinstance(j['data'], dict), "Missing 'data' object in response"

    data_obj = j['data']
    # Validate fields as specified in PRD
    assert 'questionsExtracted' in data_obj and isinstance(data_obj['questionsExtracted'], int), "'questionsExtracted' missing or not int"
    assert 'questionsStored' in data_obj and isinstance(data_obj['questionsStored'], int), "'questionsStored' missing or not int"
    assert 'processingTime' in data_obj and isinstance(data_obj['processingTime'], int), "'processingTime' missing or not int"
    assert 'pdfId' in data_obj and isinstance(data_obj['pdfId'], str), "'pdfId' missing or not string"

    print('test_process_pdf passed')


if __name__ == '__main__':
    test_process_pdf()