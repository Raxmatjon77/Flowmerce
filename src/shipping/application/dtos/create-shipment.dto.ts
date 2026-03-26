export interface CreateShipmentAddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateShipmentDto {
  orderId: string;
  address: CreateShipmentAddressDto;
}
