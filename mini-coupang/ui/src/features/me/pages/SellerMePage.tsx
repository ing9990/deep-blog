import { useMe } from '../api/use-me';

export function SellerMePage() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <p className="p-6">로딩 중...</p>;
  if (!me?.seller) return <p className="p-6">판매자 정보가 없습니다.</p>;

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">판매자 정보</h1>
      <dl className="mt-4 divide-y">
        <Row label="이메일" value={me.email} />
        <Row label="상호명" value={me.seller.businessName} />
        <Row label="사업자등록번호" value={me.seller.businessRegistrationNumber} />
        <Row label="대표자명" value={me.seller.representativeName} />
        <Row label="전화번호" value={me.seller.phoneNumber} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2 text-sm">
      <dt className="text-[hsl(var(--muted-foreground))]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
