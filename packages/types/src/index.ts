export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
}

export enum OrganizationType {
  MERCHANT = "MERCHANT",
  LOGISTICS_COMPANY = "LOGISTICS_COMPANY",
  PICKUP_STATION = "PICKUP_STATION",
}

export enum OrganizationStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  CLOSED = "CLOSED",
}

export enum VerificationStatus {
  UNVERIFIED = "UNVERIFIED",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum OrganizationMemberRole {
  OWNER = "OWNER",
  STAFF = "STAFF",
  OPERATIONS_MANAGER = "OPERATIONS_MANAGER",
  DISPATCHER = "DISPATCHER",
  FINANCE_MANAGER = "FINANCE_MANAGER",
  RIDER = "RIDER",
  MANAGER = "MANAGER",
  OPERATOR = "OPERATOR",
}

export interface JwtPayload {
  sub: string
  email?: string
  phone?: string
}

export enum ConsumerType {
  INDIVIDUAL = "INDIVIDUAL",
  MERCHANT = "MERCHANT",
}

export enum OrderStatus {
  CREATED = "CREATED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAID = "PAID",
  SEARCHING_RIDER = "SEARCHING_RIDER",
  RIDER_ASSIGNED = "RIDER_ASSIGNED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  ARRIVED_AT_STATION = "ARRIVED_AT_STATION",
  READY_FOR_COLLECTION = "READY_FOR_COLLECTION",
  COLLECTED = "COLLECTED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum DeliveryOptionType {
  HOME = "HOME",
  PICKUP_STATION = "PICKUP_STATION",
}

export enum RiderType {
  INDEPENDENT = "INDEPENDENT",
  COMPANY = "COMPANY",
}

export enum RiderAccountStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum AvailabilityStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  BUSY = "BUSY",
  PAUSED = "PAUSED",
}

export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  MAINTENANCE = "MAINTENANCE",
  RETIRED = "RETIRED",
}

export enum DispatchStatus {
  SEARCHING = "SEARCHING",
  RIDER_ACCEPTED = "RIDER_ACCEPTED",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum DispatchAttemptStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  TIMEOUT = "TIMEOUT",
}

export enum StationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CLOSED = "CLOSED",
}

export enum StationParcelStatus {
  ARRIVED = "ARRIVED",
  STORED = "STORED",
  READY_FOR_COLLECTION = "READY_FOR_COLLECTION",
  COLLECTED = "COLLECTED",
  RETURNED = "RETURNED",
}

export enum PickupCodeStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
}

export enum SettlementStatus {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum SettlementItemType {
  RIDER_PAYMENT = "RIDER_PAYMENT",
  STATION_COMMISSION = "STATION_COMMISSION",
  COMPANY_EARNING = "COMPANY_EARNING",
  PLATFORM_FEE = "PLATFORM_FEE",
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}
