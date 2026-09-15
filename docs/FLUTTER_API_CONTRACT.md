# GeoSentra — Emergency Coordinator Flutter API & Notification Contract

This specification documents the communication interface between the **GeoSentra Disaster Authority Web Application** and the **Emergency Coordinator Flutter Mobile Application**.

---

## 1. Architectural Overview

```
Disaster Authority Web App
            │
            ▼
POST /api/emergency-coordinators/assign
            │
            ├────────────────────────────────────────┐
            ▼                                        ▼
   Operation Created                        FCM Notification Payload
   (Initial: ASSIGNED)                      Dispatched to Coordinator
            │                                        │
            ▼                                        ▼
GET /api/emergency-coordinators/:id/operations   Coordinator Mobile Device
            │                                        │
            ▼                                        ▼
  Operation Received In Flutter              Coordinator Acknowledges
            │
            ▼
PATCH /api/operations/:id/status
(DISPATCHED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED)
```

---

## 2. Emergency Coordinator Identification

Coordinators are identified by unique identifier strings. In the prototype dataset:
- `coord-arun` (Arun Kumar — Senior Evacuation Specialist, Tambaram)
- `coord-meena` (Meena Krishnan — Zonal Incident Commander, Chromepet)
- `coord-nair` (Karthikeyan S — District Convoy Lead, Pallavaram)

In production, this ID corresponds to the authenticated Coordinator's user ID or Firebase UID.

---

## 3. Assignment Notification Payload (FCM Schema)

When the Disaster Authority assigns an Emergency Coordinator to a high-risk or critical habitation, a push notification is dispatched to the Coordinator's mobile device via Firebase Cloud Messaging.

### Notification Payload Schema

```json
{
  "id": "notif-1726442000000-xyz",
  "type": "EMERGENCY_ASSIGNMENT",
  "operationId": "OP-KOVAL-4821",
  "title": "New Emergency Assignment",
  "message": "You have been assigned to respond to Kovalam East.",
  "coordinatorId": "coord-arun",
  "coordinatorName": "Arun Kumar",
  "habitationId": "kovalam-east",
  "habitationName": "Kovalam East",
  "hazard": "Flood",
  "hazardLevel": "Critical",
  "reliefSiteId": "community-dev-zone",
  "reliefSiteName": "Tambaram Relief Centre",
  "routeId": "route-a",
  "routeDistanceKm": 8.4,
  "estimatedMinutes": 18,
  "sentAt": "2026-09-16T02:45:00.000Z"
}
```

### Flutter FCM Handling Example

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  if (message.data['type'] == 'EMERGENCY_ASSIGNMENT') {
    final operationId = message.data['operationId'];
    final habitationName = message.data['habitationName'];
    final reliefSiteName = message.data['reliefSiteName'];

    // Display local banner notification or navigate to Assignment Screen
    showAssignmentDialog(
      title: message.notification?.title ?? 'New Assignment',
      body: message.notification?.body ?? 'Assigned to respond to $habitationName',
      operationId: operationId,
      reliefSiteName: reliefSiteName,
    );
  }
});
```

---

## 4. API Endpoints

### 4.1 Assign Emergency Coordinator

- **URL**: `/api/emergency-coordinators/assign`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "habitationId": "kovalam-east",
  "coordinatorId": "coord-arun",
  "reliefSiteId": "community-dev-zone",
  "routeId": "route-a",
  "routeDetails": {
    "distanceKm": 8.4,
    "estimatedMinutes": 18
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "operationId": "OP-KOVAL-4821",
  "status": "ASSIGNED",
  "message": "Emergency Coordinator assigned successfully",
  "operation": {
    "id": "OP-KOVAL-4821",
    "habitationId": "kovalam-east",
    "habitationName": "Kovalam East",
    "coordinatorId": "coord-arun",
    "coordinatorName": "Arun Kumar",
    "reliefSiteId": "community-dev-zone",
    "reliefSiteName": "Tambaram Relief Centre",
    "status": "ASSIGNED",
    "assignedAt": "2026-09-16T02:45:00.000Z"
  }
}
```

---

### 4.2 Fetch Assigned Operations for Coordinator

Used by the Flutter application to pull the list of active operations assigned to the logged-in coordinator.

- **URL**: `/api/emergency-coordinators/:coordinatorId/operations`
- **Method**: `GET`
- **Headers**: `Accept: application/json`

#### Response (200 OK)
```json
{
  "success": true,
  "coordinatorId": "coord-arun",
  "count": 1,
  "operations": [
    {
      "operationId": "OP-KOVAL-4821",
      "status": "ASSIGNED",
      "assignedAt": "2026-09-16T02:45:00.000Z",
      "updatedAt": "2026-09-16T02:45:00.000Z",
      "habitation": {
        "id": "kovalam-east",
        "name": "Kovalam East",
        "district": "Coastal District, Tamil Nadu",
        "population": 2450
      },
      "hazard": {
        "type": "Flood",
        "level": "Critical"
      },
      "reliefSite": {
        "id": "community-dev-zone",
        "name": "Tambaram Relief Centre",
        "location": "Tambaram / Central District"
      },
      "route": {
        "id": "route-a",
        "distanceKm": 8.4,
        "estimatedMinutes": 18
      },
      "timeline": [
        {
          "id": "tl-1",
          "label": "Emergency Coordinator Assigned",
          "detail": "Arun Kumar assigned to respond to Kovalam East.",
          "timestamp": "2026-09-16T02:45:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 4.3 Update Operation Status (Checkpoints)

As the Emergency Coordinator progresses through the response operation, the mobile app posts status updates to this endpoint.

- **URL**: `/api/operations/:operationId/status`
- **Method**: `PATCH`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "status": "EN_ROUTE"
}
```

#### Supported Status Values
1. `ASSIGNED` — Initial state upon Disaster Authority dispatch.
2. `DISPATCHED` — Coordinator acknowledged assignment and initiated team muster.
3. `EN_ROUTE` — Coordinator and convoy are traveling along the designated relief route.
4. `ARRIVED` — Coordinator arrived on-site at the affected habitation.
5. `IN_PROGRESS` — Evacuation, relief distribution, and triage actively underway.
6. `COMPLETED` — Residents safely relocated to the designated Relief Centre.

#### Response (200 OK)
```json
{
  "success": true,
  "operationId": "OP-KOVAL-4821",
  "status": "EN_ROUTE",
  "updatedAt": "2026-09-16T02:55:00.000Z",
  "message": "Operation status successfully updated to EN_ROUTE"
}
```

---

## 5. Security & Deployment Notes

1. **Client-Side Secret Isolation**: No Firebase service account keys or private administrative credentials are stored on or exposed to client browsers.
2. **Offline Resilience**: The Flutter client should cache the latest operation and route geometry locally in SQLite/Hive to ensure continuity during network dropouts in disaster zones.
3. **Location Tracking**: In future enhancements, continuous coordinate stream uploads from the Flutter GPS sensor will post to `POST /api/operations/:operationId/telemetry` to render real-time vehicle breadcrumbs on the Disaster Authority dashboard map.
