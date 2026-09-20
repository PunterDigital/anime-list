export interface BusinessInfo {
    name: string
    address: {
        street: string
        district: string
        postcode: string
        country: string
    }
    business_number: string
    vat_number: string
}
