# Controllers

HTTP boundary layer: parse/validate requests (Zod schemas from `@nomadhome/shared`),
call a service, shape the response. Controllers contain no business logic and no
direct database access. See openspec/project.md §5.

Empty until the first capability ticket (e.g. `add-identity`) lands.
