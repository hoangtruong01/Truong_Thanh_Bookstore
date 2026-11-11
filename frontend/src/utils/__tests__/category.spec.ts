import { describe, it, expect } from 'vitest'
import {
  categoryPathToBreadcrumbs,
  findCategoryById,
  getCategoryPath,
  getChildCategories,
  getParentCategoryId,
  isCategoryAncestor,
} from '../category'

// root ─┬─ sub1 ─── grand1
//       └─ sub2      (sub2 references its parent as a populated object)
// other (root)
const root = { _id: 'root', name: 'Văn phòng phẩm', parentId: null }
const sub1 = { _id: 'sub1', name: 'Bút', parentId: 'root' }
const sub2 = { _id: 'sub2', name: 'Giấy', parentId: { _id: 'root' } }
const grand1 = { _id: 'grand1', name: 'Bút bi', parentId: 'sub1' }
const other = { _id: 'other', name: 'Sách' }
const categories = [root, sub1, sub2, grand1, other]

describe('category helpers', () => {
  describe('getParentCategoryId', () => {
    it('reads string ids, populated parents and empty parents', () => {
      expect(getParentCategoryId(sub1)).toBe('root')
      expect(getParentCategoryId(sub2)).toBe('root')
      expect(getParentCategoryId(root)).toBeNull()
      expect(getParentCategoryId(other)).toBeNull()
    })
  })

  describe('findCategoryById', () => {
    it('finds by id and tolerates empty input', () => {
      expect(findCategoryById(categories, 'sub2')).toBe(sub2)
      expect(findCategoryById(categories, 'missing')).toBeUndefined()
      expect(findCategoryById(categories, '')).toBeUndefined()
      expect(findCategoryById(null, 'root')).toBeUndefined()
    })
  })

  describe('getChildCategories', () => {
    it('returns direct children for both parentId shapes, in list order', () => {
      expect(getChildCategories(categories, 'root')).toEqual([sub1, sub2])
      expect(getChildCategories(categories, 'sub1')).toEqual([grand1])
      expect(getChildCategories(categories, 'grand1')).toEqual([])
    })

    it('returns [] for non-array input', () => {
      expect(getChildCategories(undefined, 'root')).toEqual([])
      expect(getChildCategories(null, 'root')).toEqual([])
    })
  })

  describe('getCategoryPath', () => {
    it('builds the root → leaf ancestry', () => {
      expect(getCategoryPath(categories, 'grand1')).toEqual([root, sub1, grand1])
      expect(getCategoryPath(categories, 'sub2')).toEqual([root, sub2])
      expect(getCategoryPath(categories, 'root')).toEqual([root])
    })

    it('returns [] for an unknown or empty id', () => {
      expect(getCategoryPath(categories, 'missing')).toEqual([])
      expect(getCategoryPath(categories, '')).toEqual([])
      expect(getCategoryPath([], 'root')).toEqual([])
    })

    it('stops at a parent missing from the list', () => {
      const orphan = { _id: 'orphan', name: 'Lẻ', parentId: 'deleted' }
      expect(getCategoryPath([orphan], 'orphan')).toEqual([orphan])
    })

    it('does not loop forever on cyclic data', () => {
      const a = { _id: 'a', name: 'A', parentId: 'b' }
      const b = { _id: 'b', name: 'B', parentId: 'a' }
      expect(getCategoryPath([a, b], 'a')).toEqual([b, a])
    })
  })

  describe('isCategoryAncestor', () => {
    it('is true for parents and grandparents only', () => {
      expect(isCategoryAncestor(categories, 'sub1', 'grand1')).toBe(true)
      expect(isCategoryAncestor(categories, 'root', 'grand1')).toBe(true)
      expect(isCategoryAncestor(categories, 'grand1', 'grand1')).toBe(false)
      expect(isCategoryAncestor(categories, 'sub2', 'grand1')).toBe(false)
      expect(isCategoryAncestor(categories, 'grand1', 'root')).toBe(false)
    })

    it('matches a parent that is missing from the list and handles cycles', () => {
      const orphan = { _id: 'orphan', parentId: 'deleted' }
      expect(isCategoryAncestor([orphan], 'deleted', 'orphan')).toBe(true)
      const a = { _id: 'a', parentId: 'b' }
      const b = { _id: 'b', parentId: 'a' }
      expect(isCategoryAncestor([a, b], 'zzz', 'a')).toBe(false)
    })

    it('is false for an empty selection', () => {
      expect(isCategoryAncestor(categories, 'root', '')).toBe(false)
      expect(isCategoryAncestor(categories, 'root', undefined)).toBe(false)
    })
  })

  describe('categoryPathToBreadcrumbs', () => {
    it('maps each category to a product-list link', () => {
      expect(categoryPathToBreadcrumbs(getCategoryPath(categories, 'grand1'))).toEqual([
        { label: 'Văn phòng phẩm', to: '/products?category=root' },
        { label: 'Bút', to: '/products?category=sub1' },
        { label: 'Bút bi', to: '/products?category=grand1' },
      ])
      expect(categoryPathToBreadcrumbs([])).toEqual([])
    })
  })
})
