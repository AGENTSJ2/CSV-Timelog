# CSV Timelog

Angular app that reshapes a raw time-log CSV into the export format, and renders a
weekly markdown summary from the same data.

```bash
npm start          # dev server on http://localhost:4200
npm test           # unit tests (Karma + Jasmine)
npm run build      # production bundle into dist/
```

## Architecture

```
src/app/
├── core/                              framework-free domain logic
│   ├── models/time-log.model.ts       RawTimeLogRow, OutputTimeLogRow, TimeLogFilter
│   ├── services/
│   │   ├── csv-parser.service.ts      Papa Parse boundary (parse + unparse)
│   │   ├── time-log-filter.service.ts the one place rows are kept or dropped
│   │   ├── time-log-transformer.service.ts  raw row → export row
│   │   ├── weekly-summary.service.ts  filtered rows → markdown
│   │   ├── markdown.service.ts        markdown → sanitised HTML
│   │   ├── file-download.service.ts
│   │   └── clipboard.service.ts
│   └── utils/                         date parsing, token-list parsing
├── shared/ui/multi-select/            reusable, domain-agnostic checkbox dropdown
└── features/time-log/
    ├── state/time-log.store.ts        signal store — the only mutable state
    ├── components/                    presentational: file-upload, filter-panel, weekly-preview
    └── time-log-page.component.ts     container: owns the store, wires the children
```

Three rules hold the structure together:

- **`core/` never imports from `features/` or Angular's DOM layer.** It is plain
  TypeScript behind `@Injectable`, which is why it is the part that carries tests.
- **Only the store mutates state.** Presentational components take `input()`s and
  emit `output()`s; they never touch the store.
- **One filter, one pipeline.** `rows → filteredRows → markdown → previewHtml` is a
  chain of `computed()`s. The CSV export and the on-screen preview both read
  `filteredRows()`, so the download can never contain rows the preview hid.

## Filters

| Filter | Behaviour |
| --- | --- |
| Project | Multi-select, options derived from the uploaded file. None selected = all. |
| User | Multi-select, same. |
| Include keyword | Case-insensitive substring over title, comment, type, project and id. Comma-separate for any-of. |
| Include work item IDs | Whitelist. Empty = keep everything. |
| Exclude work item IDs | Blacklist, applied after include, so it always wins. |

Dimensions are AND-ed; values within a dimension are OR-ed. Selecting exactly one
project (and/or one user) names the download after it — `timelog-Innolab.csv`.

## Input format

Headers are the raw camelCase column names from the source export:

```
minutes, user, userId, workItemId, date, dateWeek, type, comment, project, title
```

`date` arrives day-first (`27-07-2026`), which `new Date()` cannot parse — see
[`parseTimeLogDate`](src/app/core/utils/date.util.ts). When both components are
≤ 12 the value is ambiguous and is read as day-first. Rows whose date cannot be
parsed are grouped under "Undated entries" rather than dropped.
