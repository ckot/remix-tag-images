import Paginator from "./Paginator";


interface PaginatedResultsProps {
    url: string;
    page: number;
    pageSize: number;
    total: number;
    children: React.ReactNode
}


export default function PaginatedResults(
  props: PaginatedResultsProps
) {
    const {url, page, pageSize, total, children} = props;

    return (
      <div id="matches">
        <Paginator url={url} page={page} pageSize={pageSize} total={total} />
        <div className="fixed-grid">
          <div className="grid">{children}</div>
        </div>
        <Paginator url={url} page={page} pageSize={pageSize} total={total} />
      </div>
    );
}

