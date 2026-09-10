export interface NetworkDetails {
  iface: string;
  ip4: string;
  ip6: string;
  mac: string;
  type: string;
  speed: number;
  dhcp: boolean;
  rxSec: number;
  txSec: number;
  rxTotal: number;
  txTotal: number;
}

export interface PingResult {
  host: string;
  alive: boolean;
  time: number | null;
  min?: number;
  max?: number;
  avg?: number;
  error?: string;
}
