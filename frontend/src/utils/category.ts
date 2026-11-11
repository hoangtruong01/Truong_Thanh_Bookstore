/**
 * Pure helpers for walking the flat category list returned by the API, where
 * `parentId` is either a populated category, a raw id string, or empty for roots.
 */

export interface CategoryNode {
  _id: string
  parentId?: { _id: string } | string | null
}

export interface CategoryBreadcrumbItem {
  label: string
  to: string
}

/** Parent id of a category as a string, or null for a root category. */
export function getParentCategoryId(category: CategoryNode): string | null {
  const parent = category.parentId
  if (!parent) return null
  const id = typeof parent === 'object' ? parent._id : parent
  return id ? String(id) : null
}

/** Category with the given id (ids are compared as strings), or undefined. */
export function findCategoryById<T extends CategoryNode>(
  categories: readonly T[] | null | undefined,
  id: string | null | undefined,
): T | undefined {
  if (!Array.isArray(categories) || id === null || id === undefined || id === '') return undefined
  return categories.find((c) => String(c._id) === String(id))
}

/** Direct children of `parentId`, in list order. Non-array input yields []. */
export function getChildCategories<T extends CategoryNode>(
  categories: readonly T[] | null | undefined,
  parentId: string,
): T[] {
  if (!Array.isArray(categories)) return []
  return categories.filter((c) => {
    const pId = getParentCategoryId(c)
    return pId !== null && pId === String(parentId)
  })
}

/**
 * Ancestry of a category ordered root → category (inclusive). Stops at a missing
 * parent and is safe against cycles in bad data. Unknown id yields [].
 */
export function getCategoryPath<T extends CategoryNode>(
  categories: readonly T[] | null | undefined,
  categoryId: string | null | undefined,
): T[] {
  const path: T[] = []
  const visited = new Set<string>()
  let curr = findCategoryById(categories, categoryId)
  while (curr && !visited.has(String(curr._id))) {
    visited.add(String(curr._id))
    path.unshift(curr)
    const pId = getParentCategoryId(curr)
    if (!pId) break
    curr = findCategoryById(categories, pId)
  }
  return path
}

/**
 * True when `ancestorId` is a strict ancestor of `categoryId` (parent, grandparent, ...).
 * The parent id is compared before it is looked up, so a parent missing from the list still counts.
 */
export function isCategoryAncestor(
  categories: readonly CategoryNode[] | null | undefined,
  ancestorId: string,
  categoryId: string | null | undefined,
): boolean {
  const visited = new Set<string>()
  let curr = findCategoryById(categories, categoryId)
  while (curr && !visited.has(String(curr._id))) {
    visited.add(String(curr._id))
    const pId = getParentCategoryId(curr)
    if (!pId) return false
    if (pId === String(ancestorId)) return true
    curr = findCategoryById(categories, pId)
  }
  return false
}

/** Breadcrumb items (label + product-list link) for a root → leaf category path. */
export function categoryPathToBreadcrumbs(path: readonly (CategoryNode & { name: string })[]): CategoryBreadcrumbItem[] {
  return path.map((cat) => ({ label: cat.name, to: `/products?category=${cat._id}` }))
}
