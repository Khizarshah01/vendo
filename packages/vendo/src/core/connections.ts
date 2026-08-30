/**
 * The per-user CONNECTED ACCOUNT vocabulary, as the `/connections` doors answer
 * it — one definition for the three sites that speak it: `@vendoai/vendo/actions`
 * (the connector adapter that produces the rows), `@vendoai/vendo` (the doors
 * that serve them) and `@vendoai/vendo/ui` (the connect dock that reads them). None
 * of those may import each other, so this is the only place all three can meet.
 */
import type { IsoDateTime } from "./ids.js";

/** 04-actions §3 — one per-user connected account at an external connector. */
export interface ConnectionAccount {
  id: string;
  connector: string;
  toolkit: string;
  status: "initiated" | "active" | "expired" | "failed";
  createdAt?: IsoDateTime;
}

/** 04-actions §3 — what `POST /connections/initiate` returns. */
export interface InitiatedConnection {
  id: string;
  connector: string;
  redirectUrl: string;
}

/** One row of `GET /connections/catalog`: a toolkit a user could finish
 *  connecting, tagged with the broker that would carry it. The connect dock's
 *  auto catalog when the host passes no explicit list. */
export interface ConnectableToolkit {
  toolkit: string;
  connector: string;
  /** Display name; the UI falls back to its humanizer when absent. */
  label?: string;
  /** One-line capability blurb (provider metadata); surfaces may ignore it. */
  description?: string;
}
