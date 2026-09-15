// Push Notification Service Abstraction for GeoSentra & Coordinator Flutter Mobile Application.
//
// In this prototype environment, notifications are persisted in browser storage
// and dispatched to an in-memory queue. In production, this service integrates with
// Firebase Cloud Messaging (FCM HTTP v1 / Firebase Admin SDK) using coordinator device tokens.
//
// NOTICE: Never expose Firebase service-account private keys or admin secrets on the client.

const NOTIFICATIONS_STORAGE_KEY = 'geosentra_coordinator_notifications'

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
  } catch {
    // Fallback for private mode or storage quota
  }
}

class NotificationService {
  /**
   * Dispatches an Emergency Assignment notification to the assigned Emergency Coordinator.
   * Consumed by the Flutter mobile application via polling or FCM push.
   *
   * @param {Object} params
   * @param {string} params.operationId
   * @param {string} params.coordinatorId
   * @param {string} [params.coordinatorName]
   * @param {Object} params.habitation - { id, name, hazard, hazardLevel }
   * @param {Object} params.reliefSite - { id, name, location }
   * @param {Object} [params.route] - { id, distanceKm, estimatedMinutes }
   * @returns {Promise<Object>} Dispatched notification payload
   */
  async sendEmergencyAssignment({
    operationId,
    coordinatorId,
    coordinatorName = '',
    habitation,
    reliefSite,
    route = {},
  }) {
    const habitationName = habitation?.name || 'Affected Habitation'
    const reliefSiteName = reliefSite?.name || 'Designated Relief Centre'
    const hazardType = habitation?.hazard || habitation?.primaryHazard || 'Disaster Hazard'
    const hazardLevel = habitation?.hazardLevel || 'Critical'

    const notificationPayload = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'EMERGENCY_ASSIGNMENT',
      operationId,
      coordinatorId,
      coordinatorName,
      title: 'New Emergency Assignment',
      message: `You have been assigned to respond to ${habitationName}.`,
      habitationId: habitation?.id || 'HAB001',
      habitationName,
      hazard: hazardType,
      hazardLevel,
      reliefSiteId: reliefSite?.id || 'RS001',
      reliefSiteName,
      routeId: route?.id || 'ROUTE001',
      routeDistanceKm: route?.distanceKm || 8.4,
      estimatedMinutes: route?.estimatedMinutes || 18,
      sentAt: new Date().toISOString(),
      read: false,
    }

    // Persist to prototype coordinator notification inbox
    const all = getStoredNotifications()
    all.unshift(notificationPayload)
    saveNotifications(all)

    // Console dispatch log for prototype inspection and debugging
    console.info(
      `[GeoSentra Notification Service] -> FCM Push dispatched to Coordinator: ${coordinatorId} (${coordinatorName})`,
      notificationPayload
    )

    // PRODUCTION FCM INTEGRATION HOOK (When Firebase Cloud Messaging is configured):
    /*
    if (process.env.FCM_SERVER_KEY) {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `/topics/coordinator_${coordinatorId}`,
          notification: {
            title: notificationPayload.title,
            body: notificationPayload.message,
          },
          data: notificationPayload,
          priority: 'high',
        }),
      });
    }
    */

    return notificationPayload
  }

  /**
   * Retrieves notifications intended for a specific Emergency Coordinator (for Flutter polling).
   * @param {string} coordinatorId
   * @returns {Array<Object>}
   */
  getCoordinatorNotifications(coordinatorId) {
    const all = getStoredNotifications()
    return all.filter((n) => !coordinatorId || n.coordinatorId === coordinatorId)
  }

  /**
   * Marks a notification as acknowledged/read by the mobile client.
   * @param {string} notificationId
   */
  markNotificationRead(notificationId) {
    const all = getStoredNotifications().map((n) =>
      n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
    )
    saveNotifications(all)
  }
}

export const notificationService = new NotificationService()
