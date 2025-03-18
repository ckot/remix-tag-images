import {
  Link,
  NavLink
} from "@remix-run/react";

import classNames from "classnames"

// interface PageLinkProps {
//     url: string;
//     label: string;
//     page: number;
//     pageSize: number;
//     deactivate?: boolean;
// }

interface PaginatorProps {
  url: string;
  page: number;
  pageSize: number;
  total: number;
}


const mkSearchParams = (url: string, page: number) => {
  const newURL = new URL(url)
  newURL.searchParams.set("page", (page).toString())
  return "?" + newURL.searchParams.toString();
}

export default function Paginator(props: PaginatorProps) {
    const {url, page, pageSize, total} = props
    const start = (page - 1) * pageSize + 1;
    let end = start + pageSize;
    if (end > total) {
      end = total;
    }

    let numPages = Math.floor(total / pageSize)

    if ((numPages * pageSize) < total) {
        numPages += 1;
    }
    const pages = Array.from({length: numPages}, (_, index) => index+1)

    return (
      <>
        <span>
          Matches {start} - {end} of {total}
        </span>
        <span> Page: {page} </span>

        <nav className="pagination is-centered" role="navigation" aria-label="pagination">
          {page - 1 === 0 ? (
            <button type="button" className="pagination-previous" disabled>
              Previous
            </button>
          ) : (
            <Link
              to={{
                pathname: "/images",
                search: mkSearchParams(url, page - 1),
              }}
              className="pagination-previous"
            >
              Prev
            </Link>
          )}
          {page === numPages ? (
            <button type="button" className="pagination-next" disabled>
              Next
            </button>
          ) : (
            <Link
              to={{
                pathname: "/images",
                search: mkSearchParams(url, numPages),
              }}
              className="pagination-next"
            >
              Next
            </Link>
          )}

          <ul className="pagination-list">
            {pages.map((pageNum) => (
              <li key={pageNum}>
                {pageNum === page ? (
                  <button
                    type="button"
                    className="pagination-link is-current"
                    disabled
                    aria-label={`Page ${pageNum}`}
                    aria-current="page"
                  >
                    {pageNum}
                  </button>
                ) : (
                  <NavLink
                    className={classNames({
                      "pagination-link": true,
                    })}
                    to={{
                      pathname: "/images",
                      search: mkSearchParams(url, pageNum),
                    }}
                    aria-label={`Goto page ${pageNum}`}
                  >
                    {pageNum}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </>
    );
}

// function PageLink(props: PageLinkProps) {
//     const {url, label, page, pageSize, deactivate = false} = props;
//     const origURL = new URL(url)
//     const origPage = Number(origURL.searchParams.get("page")) || 1
//     const newURL = new URL(origURL.toString())
//     newURL.searchParams.set("page", page.toString())
//     newURL.searchParams.set("pageSize", pageSize.toString())

//     const linkClasses = classNames({
//       "active": origPage === page,
//       "button": true
//     });

//     return (
//       <>
//       {deactivate ? (
//         <button
//           className={origPage === page ? "active": ""}
//           onClick={() => {}}
//           disabled
//         >
//           {label}
//         </button>
//       ): (
//         <NavLink
//           className={linkClasses}
//           to={newURL.toString()}
//         >
//         {" "} {label} {""}
//         </NavLink>
//       )}
//       </>
//     );
// }


// <li>
//               <PageLink
//                 url={url}
//                 label="→"
//                 page={numPages}
//                 pageSize={pageSize}
//                 deactivate={page === numPages}
//               />
//             </li>
//             <li>
//               <PageLink
//                 url={url}
//                 label="⇥"
//                 page={numPages}
//                 pageSize={pageSize}
//                 deactivate={page === numPages}
//               />
//             </li>
// <li>
//               <PageLink
//                 url={url}
//                 label="⇤"
//                 page={1}
//                 pageSize={pageSize}
//                 deactivate={page === 1}
//               />
//             </li>
//             <li>
//               <PageLink
//                 url={url}
//                 label="←"
//                 page={1}
//                 pageSize={pageSize}
//                 deactivate={page === 1}
//               />
//             </li>

// <nav class="pagination" role="navigation" aria-label="pagination">
//   <a href="#" class="pagination-previous">
//     Previous
//   </a>
//   <a href="#" class="pagination-next">
//     Next page
//   </a>
//   <ul class="pagination-list">
//     <li>
//       <a href="#" class="pagination-link" aria-label="Goto page 1">
//         1
//       </a>
//     </li>
//     <li>
//       <span class="pagination-ellipsis">&hellip;</span>
//     </li>
//     <li>
//       <a href="#" class="pagination-link" aria-label="Goto page 45">
//         45
//       </a>
//     </li>
//     <li>
//       <a
//         class="pagination-link is-current"
//         aria-label="Page 46"
//         aria-current="page"
//       >
//         46
//       </a>
//     </li>
//     <li>
//       <a href="#" class="pagination-link" aria-label="Goto page 47">
//         47
//       </a>
//     </li>
//     <li>
//       <span class="pagination-ellipsis">&hellip;</span>
//     </li>
//     <li>
//       <a href="#" class="pagination-link" aria-label="Goto page 86">
//         86
//       </a>
//     </li>
//   </ul>
// </nav>;