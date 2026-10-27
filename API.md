# API Specification & Communication Protocols (API.md)
**Product**: Dr. Shastri Diagnostics (DSD Care) Aligarh PWA & GIA LIMS  
**Base Server**: `http://127.0.0.1:3001` (GIA LIMS Core)  
**Protocol**: REST (JSON) + WebSocket (Telemetry) + HL7 / ASTM (Analyzers)  
**Status**: APPROVED & ACTIVE  

---

## 1. Global Conventions & Standard Envelope

All REST API responses return a deterministic JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-27T10:45:00.000Z"
}
```

### HTTP Status Codes:
- `200 OK`: Successful query / update.
- `201 Created`: Entity successfully created (e.g. Booking, Specimen).
- `400 Bad Request`: Validation failure (e.g. invalid phone number, missing slot).
- `401 Unauthorized`: Missing or expired Bearer JWT token.
- `403 Forbidden`: Insufficient role permissions (e.g. phlebotomist attempting pathologist sign-off).
- `404 Not Found`: Booking or Report reference does not exist.
- `422 Unprocessable Entity`: Westgard QC violation or cold-chain integrity breach.

---

## 2. Authentication & Authorization

### `POST /api/auth/login`
Authenticates staff, phlebotomists, sales officers, pathologists, and administrators.
- **Request**:
  ```json
  {
    "username": "dr.shastri",
    "password": "SecurePassword123",
    "role": "admin"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "role": "admin",
      "user": {
        "id": "USR-001",
        "name": "Dr. S. K. Shastri",
        "email": "shastri@dsdcare.in"
      }
    },
    "timestamp": "2026-10-27T10:45:00.000Z"
  }
  ```

---

## 3. Order Management & PWA Integration

### `POST /api/orders`
Pushes home collection bookings from the Patient PWA into the LIMS order pipeline.
- **Request**:
  ```json
  {
    "patientName": "Sunita Sharma",
    "phone": "+91 98370 12345",
    "testCode": "SMARTADVANCE",
    "packageName": "DSD Smart Health Advance (84 Parameters)",
    "slot": "Tomorrow, 7:00–8:00 AM (Fasting)",
    "locality": "Ramghat Road",
    "dispatchHubId": "hub-ramghat",
    "address": "1246, Vidyanagar Colony, Aligarh",
    "gps": { "lat": 27.9135, "lng": 78.0782 },
    "collectionOtp": "8492"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "bookingRef": "DSD-2401",
      "allocatedBarcodes": ["BC-DSD-98124-E", "BC-DSD-98124-G", "BC-DSD-98124-F"],
      "assignedPhlebo": "Rahul Sharma",
      "etaMinutes": 18,
      "status": "SCHEDULED"
    },
    "timestamp": "2026-10-27T10:45:00.000Z"
  }
  ```

---

## 4. Cryptographic Provenance & Public Verification

### `GET /verify/:hash`
Public, zero-auth verification endpoint accessed when scanning report QR codes.
- **Parameters**: `hash` (64-character hexadecimal SHA-256 string or `VER-{bookingId}`)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "DSD-2401",
      "patientName": "Sunita Sharma",
      "reportedTimestamp": "2026-10-27T11:30:00.000Z",
      "sha256": "3a9f2c8e1d4b7f6a5e8c2b1a9f4d7e3c8b5a2f1e6d4c8a7b9e2f4a1c8d5b7e9a",
      "isIntegrityVerified": true,
      "signatories": [
        { "name": "Dr. S. K. Shastri, MD (AIIMS)", "role": "Chief Pathologist", "signedAt": "2026-10-27T11:28:14Z" },
        { "name": "Dr. Ananya Shastri, MD", "role": "Consultant Microbiologist", "signedAt": "2026-10-27T11:29:40Z" }
      ],
      "nablAccreditation": "MC-2847 (ISO 15189:2022)"
    },
    "timestamp": "2026-10-27T10:45:00.000Z"
  }
  ```

---

## 5. Cold-Chain IoT Telemetry (FlaboTrack™)

### `POST /api/telemetry/cold-chain`
Streamed from phlebotomist IoT collection kits.
- **Request**:
  ```json
  {
    "kitId": "KIT-ALIGARH-04",
    "collectorId": "Rahul Sharma",
    "specimenBarcode": "BC-DSD-98124-G",
    "temperatureC": 3.8,
    "gps": { "lat": 27.9142, "lng": 78.0775 },
    "batteryPercent": 94
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "NORMAL",
      "targetTempRange": "2.0°C - 8.0°C",
      "breachAlarm": false
    },
    "timestamp": "2026-10-27T10:45:00.000Z"
  }
  ```

---

## 6. Analyzer Clinical Messaging Protocols

1. **ASTM 1394-91 (Beckman Coulter AU480 & Cobas e411)**:
   - `H|\^&|||BeckmanCoulterAU|||||||P|1394-91`
   - `P|1|||Sharma^Sunita||19740512|F`
   - `O|1|BC-DSD-98124||^^^GLUCOSE\^^^SGPT|||||||A`
   - `R|1|^^^GLUCOSE|108|mg/dL|70-99|H||F`
   - `L|1|N`
2. **HL7 v2.5 (Sysmex XN-550 Hematology)**:
   - `MSH|^~\&|Sysmex|XN-550|GIA_LIMS|DSD_ALIGARH|20261027110000||ORU^R01|MSG001|P|2.5`
   - `PID|1||DSD-2401||Sharma^Sunita||19740512|F`
   - `OBR|1||BC-DSD-98124-E|CBC^Complete Blood Count`
   - `OBX|1|NM|718-7^Hemoglobin^LN||13.4|g/dL|12.0-15.5|N|||F`
