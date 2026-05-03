import { EmptyState } from "@/components/ui/EmptyState";

export default function SavingsPage() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
      <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700 }}>Tabungan</h1>
      <EmptyState
        icon="🐷"
        title="Belum ada goals tabungan"
        description="Fitur savings goals sedang disiapkan. Kamu bisa tambah akun tabungan dulu di halaman Akun."
        actionLabel="Kelola Akun"
        actionHref="/account"
      />
    </div>
  );
}
