import * as signalR from '@microsoft/signalr'
import type { Order } from '@/types'

let connection: signalR.HubConnection | null = null

function getHubUrl(): string {
  if (import.meta.env.VITE_HUB_URL) return import.meta.env.VITE_HUB_URL
  // Dev: doğrudan API — Vite proxy + Safari localhost bazen 403 (AirTunes) verir
  if (import.meta.env.DEV) return 'http://127.0.0.1:5000/hubs/orders'
  return '/hubs/orders'
}

export function getSignalRConnection() {
  if (!connection) {
    const hubUrl = getHubUrl()
    connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('lora_token') || '',
      })
      .withAutomaticReconnect()
      .build()
  }
  return connection
}

export async function startSignalR(
  onOrderCreated: (order: Order) => void,
  onOrderStatusChanged: (order: Order) => void
) {
  const conn = getSignalRConnection()
  conn.off('OrderCreated')
  conn.off('OrderStatusChanged')
  conn.on('OrderCreated', onOrderCreated)
  conn.on('OrderStatusChanged', onOrderStatusChanged)

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start()
    } catch (err) {
      console.warn('SignalR bağlantısı kurulamadı, polling devam edecek:', err)
    }
  }
}

export async function stopSignalR() {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop()
  }
}
