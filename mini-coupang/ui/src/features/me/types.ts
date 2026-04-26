export interface MeMember {
  memberId: number;
  name: string;
  phoneNumber: string;
  nickname: string | null;
}
export interface MeSeller {
  sellerId: number;
  businessName: string;
  businessRegistrationNumber: string;
  representativeName: string;
  phoneNumber: string;
}
export interface Me {
  accountId: number;
  email: string;
  member: MeMember | null;
  seller: MeSeller | null;
}
