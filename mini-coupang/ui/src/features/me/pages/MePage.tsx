import { useMe } from '../api/use-me';

export function MePage() {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <p className="p-6">로딩 중...</p>;
  if (!me?.member) return <p className="p-6">회원 정보가 없습니다.</p>;

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">내 정보</h1>
      <dl className="mt-4 divide-y">
        <Row label="이메일" value={me.email} />
        <Row label="이름" value={me.member.name} />
        <Row label="전화번호" value={me.member.phoneNumber} />
        <Row label="닉네임" value={me.member.nickname ?? '-'} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 py-2 text-sm">
      <dt className="text-[hsl(var(--muted-foreground))]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
