import { Card, PageHeader } from '../components/ui';

export default function ComingSoon({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <Card className="p-8 text-center">
        <p className="font-mono text-sm text-muted">$ build --target {title.toLowerCase()}</p>
        <p className="mt-2 text-sm text-muted">This screen is coming soon.</p>
      </Card>
    </>
  );
}