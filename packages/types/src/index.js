export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["BANNED"] = "BANNED";
})(UserStatus || (UserStatus = {}));
export var OrganizationType;
(function (OrganizationType) {
    OrganizationType["MERCHANT"] = "MERCHANT";
    OrganizationType["LOGISTICS_COMPANY"] = "LOGISTICS_COMPANY";
    OrganizationType["PICKUP_STATION"] = "PICKUP_STATION";
})(OrganizationType || (OrganizationType = {}));
export var OrganizationStatus;
(function (OrganizationStatus) {
    OrganizationStatus["ACTIVE"] = "ACTIVE";
    OrganizationStatus["SUSPENDED"] = "SUSPENDED";
    OrganizationStatus["CLOSED"] = "CLOSED";
})(OrganizationStatus || (OrganizationStatus = {}));
export var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["UNVERIFIED"] = "UNVERIFIED";
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["REJECTED"] = "REJECTED";
})(VerificationStatus || (VerificationStatus = {}));
export var OrganizationMemberRole;
(function (OrganizationMemberRole) {
    OrganizationMemberRole["OWNER"] = "OWNER";
    OrganizationMemberRole["STAFF"] = "STAFF";
    OrganizationMemberRole["OPERATIONS_MANAGER"] = "OPERATIONS_MANAGER";
    OrganizationMemberRole["DISPATCHER"] = "DISPATCHER";
    OrganizationMemberRole["FINANCE_MANAGER"] = "FINANCE_MANAGER";
    OrganizationMemberRole["RIDER"] = "RIDER";
    OrganizationMemberRole["MANAGER"] = "MANAGER";
    OrganizationMemberRole["OPERATOR"] = "OPERATOR";
})(OrganizationMemberRole || (OrganizationMemberRole = {}));
export var ConsumerType;
(function (ConsumerType) {
    ConsumerType["INDIVIDUAL"] = "INDIVIDUAL";
    ConsumerType["MERCHANT"] = "MERCHANT";
})(ConsumerType || (ConsumerType = {}));
export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["CREATED"] = "CREATED";
    OrderStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["SEARCHING_RIDER"] = "SEARCHING_RIDER";
    OrderStatus["RIDER_ASSIGNED"] = "RIDER_ASSIGNED";
    OrderStatus["PICKED_UP"] = "PICKED_UP";
    OrderStatus["IN_TRANSIT"] = "IN_TRANSIT";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["ARRIVED_AT_STATION"] = "ARRIVED_AT_STATION";
    OrderStatus["READY_FOR_COLLECTION"] = "READY_FOR_COLLECTION";
    OrderStatus["COLLECTED"] = "COLLECTED";
    OrderStatus["FAILED"] = "FAILED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (OrderStatus = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (PaymentStatus = {}));
export var DeliveryOptionType;
(function (DeliveryOptionType) {
    DeliveryOptionType["HOME"] = "HOME";
    DeliveryOptionType["PICKUP_STATION"] = "PICKUP_STATION";
})(DeliveryOptionType || (DeliveryOptionType = {}));
export var RiderType;
(function (RiderType) {
    RiderType["INDEPENDENT"] = "INDEPENDENT";
    RiderType["COMPANY"] = "COMPANY";
})(RiderType || (RiderType = {}));
export var RiderAccountStatus;
(function (RiderAccountStatus) {
    RiderAccountStatus["ACTIVE"] = "ACTIVE";
    RiderAccountStatus["INACTIVE"] = "INACTIVE";
    RiderAccountStatus["SUSPENDED"] = "SUSPENDED";
})(RiderAccountStatus || (RiderAccountStatus = {}));
export var AvailabilityStatus;
(function (AvailabilityStatus) {
    AvailabilityStatus["ONLINE"] = "ONLINE";
    AvailabilityStatus["OFFLINE"] = "OFFLINE";
    AvailabilityStatus["BUSY"] = "BUSY";
    AvailabilityStatus["PAUSED"] = "PAUSED";
})(AvailabilityStatus || (AvailabilityStatus = {}));
export var VehicleStatus;
(function (VehicleStatus) {
    VehicleStatus["ACTIVE"] = "ACTIVE";
    VehicleStatus["MAINTENANCE"] = "MAINTENANCE";
    VehicleStatus["RETIRED"] = "RETIRED";
})(VehicleStatus || (VehicleStatus = {}));
export var DispatchStatus;
(function (DispatchStatus) {
    DispatchStatus["SEARCHING"] = "SEARCHING";
    DispatchStatus["RIDER_ACCEPTED"] = "RIDER_ACCEPTED";
    DispatchStatus["COMPLETED"] = "COMPLETED";
    DispatchStatus["EXPIRED"] = "EXPIRED";
    DispatchStatus["CANCELLED"] = "CANCELLED";
})(DispatchStatus || (DispatchStatus = {}));
export var DispatchAttemptStatus;
(function (DispatchAttemptStatus) {
    DispatchAttemptStatus["PENDING"] = "PENDING";
    DispatchAttemptStatus["ACCEPTED"] = "ACCEPTED";
    DispatchAttemptStatus["DECLINED"] = "DECLINED";
    DispatchAttemptStatus["TIMEOUT"] = "TIMEOUT";
})(DispatchAttemptStatus || (DispatchAttemptStatus = {}));
export var StationStatus;
(function (StationStatus) {
    StationStatus["ACTIVE"] = "ACTIVE";
    StationStatus["INACTIVE"] = "INACTIVE";
    StationStatus["CLOSED"] = "CLOSED";
})(StationStatus || (StationStatus = {}));
export var StationParcelStatus;
(function (StationParcelStatus) {
    StationParcelStatus["ARRIVED"] = "ARRIVED";
    StationParcelStatus["STORED"] = "STORED";
    StationParcelStatus["READY_FOR_COLLECTION"] = "READY_FOR_COLLECTION";
    StationParcelStatus["COLLECTED"] = "COLLECTED";
    StationParcelStatus["RETURNED"] = "RETURNED";
})(StationParcelStatus || (StationParcelStatus = {}));
export var PickupCodeStatus;
(function (PickupCodeStatus) {
    PickupCodeStatus["ACTIVE"] = "ACTIVE";
    PickupCodeStatus["USED"] = "USED";
    PickupCodeStatus["EXPIRED"] = "EXPIRED";
})(PickupCodeStatus || (PickupCodeStatus = {}));
export var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["PENDING"] = "PENDING";
    SettlementStatus["PROCESSED"] = "PROCESSED";
    SettlementStatus["PAID"] = "PAID";
    SettlementStatus["CANCELLED"] = "CANCELLED";
})(SettlementStatus || (SettlementStatus = {}));
export var SettlementItemType;
(function (SettlementItemType) {
    SettlementItemType["RIDER_PAYMENT"] = "RIDER_PAYMENT";
    SettlementItemType["STATION_COMMISSION"] = "STATION_COMMISSION";
    SettlementItemType["COMPANY_EARNING"] = "COMPANY_EARNING";
    SettlementItemType["PLATFORM_FEE"] = "PLATFORM_FEE";
})(SettlementItemType || (SettlementItemType = {}));
