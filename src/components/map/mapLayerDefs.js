import { AlertTriangle, Users, Building2, Layers } from 'lucide-react'

// Shared "Map Layers" toggle definitions and safe-site marker color, reused by
// every page that renders the map layers control (Overview, Authority Overview)
// so the layer set/order/icons can never drift apart between them.
export const SAFE_SITE_COLOR = '#059669'

export const LAYER_DEFS = [
  { id: 'hazards', label: 'Hazard Layers', icon: AlertTriangle },
  { id: 'population', label: 'Population', icon: Users },
  { id: 'infrastructure', label: 'Infrastructure', icon: Building2 },
  { id: 'safeSites', label: 'Safe Sites', icon: Layers },
]
