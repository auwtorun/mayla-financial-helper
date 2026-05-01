import { TransactionForm } from "@/features/transaction/TransactionForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({ params }: Props) {
  const { id } = await params;
  return <TransactionForm editId={id} />;
}
