// Tiny DSL used by the spec files. Everything the generator emits (markdown, OpenAPI, Postman)
// is derived from what is registered here, so the three outputs can never disagree.

import { ok, list, err, validation, notFound, forbidden, conflict } from './fixtures.mjs';

export const modules = [];
export const models = [];

export function defineModule(id, title, description, extra = {}) {
  const mod = { id, title, description, endpoints: [], ...extra };
  modules.push(mod);
  return mod;
}

export function defineModel(name, description, fields, example) {
  models.push({ name, description, fields, example });
}

export const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];
export const SA = ['SUPER_ADMIN'];
export const ADMIN_HR = ['ADMIN', 'HR'];
export const SA_ADMIN = ['SUPER_ADMIN', 'ADMIN'];

/** Register a single endpoint on a module. `responses` is a list of [status, scenario, body]. */
export function ep(mod, e) {
  const endpoint = {
    module: mod.id,
    roles: ALL_ROLES,
    pathParams: [],
    query: [],
    notes: [],
    ...e,
    responses: (e.responses ?? []).map(([status, scenario, body, headers]) => ({ status, scenario, body, headers })),
  };
  endpoint.id = endpoint.id ?? `${mod.id}.${endpoint.method.toLowerCase()}.${endpoint.path}`;
  mod.endpoints.push(endpoint);
  return endpoint;
}

// ── Reusable query-parameter sets ───────────────────────────────────────────
export const PAGING = [
  ['page', 'int', false, 'Page number, starting at 1. Default `1`.'],
  ['pageSize', 'int', false, 'Rows per page. Default `10`, max `200`.'],
];
export const SEARCH = [['search', 'string', false, 'Case-insensitive text search.']];
export const SORT = (fields) => [
  ['sortBy', 'string', false, `Sort field. One of: ${fields.map((f) => `\`${f}\``).join(', ')}.`],
  ['sortOrder', 'enum:asc|desc', false, 'Sort direction. Default `asc`.'],
];

/**
 * Generates the standard list / get / create / update / status / delete endpoints for a resource.
 * Endpoint-specific scenarios are passed in `cfg`; anything unusual should be added with `ep()` afterwards.
 */
export function crud(mod, cfg) {
  const {
    tag, plural, base, idParam, model, model2, listRoles, readRoles = listRoles, writeRoles,
    filters = [], sortFields = ['name', 'createdAt'], fields, createExample, updateExample = createExample,
    validationErrors, duplicate, usedBy = {}, scopeNote, status, del, updateMethod = 'PUT',
    listPurpose, getPurpose, createPurpose, updatePurpose, extraCreateResponses = [], extraUpdateResponses = [],
    updateFields = fields, listQueryExtra = [], searchable = true, updatePartial = false,
  } = cfg;

  const idParams = [[idParam, 'string', `${tag} id.`]];
  const scopeNotes = scopeNote ? [scopeNote] : [];

  if (listRoles) {
    ep(mod, {
      method: 'GET', path: base, title: `List ${plural}`,
      purpose: listPurpose ?? `Paginated list of ${plural}, with filters and search. Powers the ${plural} table.`,
      roles: listRoles, usedBy: usedBy.list,
      query: [...PAGING, ...(searchable ? SEARCH : []), ...filters, ...listQueryExtra, ...SORT(sortFields)],
      notes: scopeNotes,
      responses: [
        [200, `${plural} found`, list([model, model2 ?? model], { pageSize: 10, total: 2 })],
        [200, 'No matches (empty list, not an error)', list([], { total: 0 })],
        [422, 'Invalid paging / filter value', validation(['pageSize', 'Must be between 1 and 200'])],
      ],
    });
  }

  if (readRoles) {
    ep(mod, {
      method: 'GET', path: `${base}/{${idParam}}`, title: `Get ${tag.toLowerCase()}`,
      purpose: getPurpose ?? `Fetch a single ${tag.toLowerCase()} by id.`,
      roles: readRoles, usedBy: usedBy.get, pathParams: idParams, notes: scopeNotes,
      responses: [
        [200, `${tag} found`, ok(model)],
        [404, `${tag} does not exist (or is outside the caller's scope)`, notFound(tag)],
      ],
    });
  }

  if (writeRoles && fields) {
    ep(mod, {
      method: 'POST', path: base, title: `Create ${tag.toLowerCase()}`,
      purpose: createPurpose ?? `Create a new ${tag.toLowerCase()}.`,
      roles: writeRoles, usedBy: usedBy.create, notes: scopeNotes,
      body: { fields, example: createExample },
      responses: [
        [201, `${tag} created`, ok(model, `${tag} created successfully`)],
        [422, 'Validation failed', validation(...validationErrors)],
        ...(duplicate ? [[409, duplicate.scenario ?? 'Duplicate value', conflict(duplicate.message, duplicate.code ?? 'DUPLICATE_ENTRY', { field: duplicate.field })]] : []),
        [403, 'Caller cannot create in that scope', forbidden(cfg.forbiddenMessage)],
        ...extraCreateResponses,
      ],
    });

    ep(mod, {
      method: updateMethod, path: `${base}/{${idParam}}`, title: `Update ${tag.toLowerCase()}`,
      purpose: updatePurpose ?? `${updatePartial ? 'Partially update' : 'Replace the editable fields of'} a ${tag.toLowerCase()}.`,
      roles: writeRoles, usedBy: usedBy.update, pathParams: idParams, notes: scopeNotes,
      body: { fields: updateFields, example: updateExample },
      responses: [
        [200, `${tag} updated`, ok({ ...model, ...updateExample }, `${tag} updated successfully`)],
        [404, `${tag} not found`, notFound(tag)],
        [422, 'Validation failed', validation(...validationErrors.slice(0, 2))],
        ...(duplicate ? [[409, duplicate.scenario ?? 'Duplicate value', conflict(duplicate.message, duplicate.code ?? 'DUPLICATE_ENTRY', { field: duplicate.field })]] : []),
        ...extraUpdateResponses,
      ],
    });
  }

  if (status) {
    ep(mod, {
      method: 'PATCH', path: `${base}/{${idParam}}/status`, title: `Activate / deactivate ${tag.toLowerCase()}`,
      purpose: status.purpose ?? `Set a ${tag.toLowerCase()}'s status to ACTIVE or INACTIVE. Replaces the UI toggle (the server sets an explicit status instead of flipping it, so retries are safe).`,
      roles: status.roles ?? writeRoles, usedBy: usedBy.status, pathParams: idParams,
      notes: status.notes ?? [],
      body: { fields: [['status', 'enum:ACTIVE|INACTIVE', true, 'Target status.']], example: { status: 'INACTIVE' } },
      responses: [
        [200, 'Status changed', ok({ ...model, status: 'INACTIVE' }, `${tag} deactivated`)],
        [200, 'Already in that status (idempotent no-op)', ok(model, `${tag} is already ACTIVE`)],
        [404, `${tag} not found`, notFound(tag)],
        [422, 'Invalid status value', validation(['status', 'Must be one of ACTIVE, INACTIVE'])],
        ...(status.extra ?? []),
      ],
    });
  }

  if (del) {
    ep(mod, {
      method: 'DELETE', path: `${base}/{${idParam}}`, title: `Delete ${tag.toLowerCase()}`,
      purpose: del.purpose ?? `Delete a ${tag.toLowerCase()}.`,
      roles: del.roles ?? writeRoles, usedBy: usedBy.del, pathParams: idParams, notes: del.notes ?? [],
      responses: [
        [200, `${tag} deleted`, ok(null, `${tag} deleted successfully`)],
        [404, `${tag} not found`, notFound(tag)],
        [409, del.blockedScenario ?? 'Blocked — still in use', conflict(del.blockedMessage, del.blockedCode ?? 'IN_USE')],
      ],
    });
  }
}

export { ok, list, err, validation, notFound, forbidden, conflict };
