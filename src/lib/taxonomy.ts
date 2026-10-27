/**
 * Single Source of Truth for Product Taxonomy across Tí Coolture.
 * 
 * Defines the 7 main groups and 30 leaf categories with both:
 * - Clean slugs (e.g., 'do-gom', 'thoi-trang')
 * - Supabase UUIDs
 * - Vietnamese names & English names
 * - Lookup functions that resolve ANY input (UUID, slug, prefixed slug 'cat-*', or Vietnamese name)
 */

export interface CategoryLeafDef {
  id: string; // Supabase UUID
  slug: string; // Clean slug (e.g. 'do-gom')
  legacyId?: string; // e.g. 'cat-do-gom'
  name: string; // Vietnamese name
  nameEn: string;
  groupSlug: string;
  groupName: string;
}

export interface CategoryGroupDef {
  id: string; // Supabase UUID
  slug: string; // Clean slug (e.g. 'noi-that')
  legacyId?: string; // e.g. 'cat-noi-that'
  name: string; // Vietnamese name
  nameEn: string;
  items: CategoryLeafDef[];
}

export const TAXONOMY: CategoryGroupDef[] = [
  {
    id: "918abf1c-0784-4aed-a192-6e389ae3012f",
    slug: "thoi-trang",
    legacyId: "cat-thoi-trang",
    name: "Thời trang",
    nameEn: "Fashion",
    items: [
      {
        id: "6aa96cdd-0284-46fe-a9b0-915496828f3f",
        slug: "quan-ao",
        legacyId: "cat-quan-ao",
        name: "Quần áo",
        nameEn: "Clothing",
        groupSlug: "thoi-trang",
        groupName: "Thời trang",
      },
      {
        id: "5c3dbaff-d026-4bc5-abaa-dff6b8beec6b",
        slug: "phu-kien",
        legacyId: "cat-phu-kien",
        name: "Phụ kiện",
        nameEn: "Accessories",
        groupSlug: "thoi-trang",
        groupName: "Thời trang",
      },
      {
        id: "cffa719e-b096-4e6b-aeb4-7b3309057bc1",
        slug: "phu-kien-dien-thoai",
        legacyId: "cat-phu-kien-dien-thoai",
        name: "Phụ kiện điện thoại",
        nameEn: "Phone accessories",
        groupSlug: "thoi-trang",
        groupName: "Thời trang",
      },
    ],
  },
  {
    id: "fe6e2b76-a89d-4222-a56b-38d1e2b0d0c0",
    slug: "san-pham-nghe-thuat",
    legacyId: "cat-san-pham-nghe-thuat",
    name: "Sản phẩm nghệ thuật",
    nameEn: "Art Products",
    items: [
      {
        id: "1c866d1e-15cf-4fc0-a66f-725c9d98d4b2",
        slug: "tranh-ky-thuat-so",
        legacyId: "cat-tranh-ky-thuat-so",
        name: "Tranh Kỹ thuật số",
        nameEn: "Digital prints",
        groupSlug: "san-pham-nghe-thuat",
        groupName: "Sản phẩm nghệ thuật",
      },
      {
        id: "7225d735-da4f-44a6-a2c0-2933ded523c8",
        slug: "tranh-riso",
        legacyId: "cat-tranh-riso",
        name: "Tranh Riso",
        nameEn: "Riso prints",
        groupSlug: "san-pham-nghe-thuat",
        groupName: "Sản phẩm nghệ thuật",
      },
      {
        id: "6d602c0b-6c0e-4232-adf0-7e538f0321a7",
        slug: "tranh-nguyen-ban",
        legacyId: "cat-tranh-nguyen-ban",
        name: "Tranh nguyên bản",
        nameEn: "Original prints",
        groupSlug: "san-pham-nghe-thuat",
        groupName: "Sản phẩm nghệ thuật",
      },
      {
        id: "bf01326b-a221-482f-a868-3d977a25e677",
        slug: "zine",
        legacyId: "cat-zine",
        name: "Zine",
        nameEn: "Zines",
        groupSlug: "san-pham-nghe-thuat",
        groupName: "Sản phẩm nghệ thuật",
      },
    ],
  },
  {
    id: "62f3789e-8f9f-453a-a337-8aefd5da8928",
    slug: "van-phong-pham",
    legacyId: "cat-van-phong-pham",
    name: "Văn phòng phẩm",
    nameEn: "Stationery",
    items: [
      {
        id: "6bba7683-79a8-478a-a1f0-ab8da4ec4873",
        slug: "so",
        legacyId: "cat-so",
        name: "Sổ",
        nameEn: "Notebooks",
        groupSlug: "van-phong-pham",
        groupName: "Văn phòng phẩm",
      },
      {
        id: "387496d2-ab8f-4dba-a993-d6fecde31e70",
        slug: "giay-ghi-chu",
        legacyId: "cat-giay-ghi-chu",
        name: "Giấy ghi chú",
        nameEn: "Sticky notes",
        groupSlug: "van-phong-pham",
        groupName: "Văn phòng phẩm",
      },
      {
        id: "38b7081e-d3a8-4c2d-a627-00f9a42369d4",
        slug: "so-lap-ke-hoach",
        legacyId: "cat-so-lap-ke-hoach",
        name: "Sổ lập kế hoạch",
        nameEn: "Planners",
        groupSlug: "van-phong-pham",
        groupName: "Văn phòng phẩm",
      },
      {
        id: "058843d4-51e1-495d-ad4d-40fd6c817b70",
        slug: "lich",
        legacyId: "cat-lich",
        name: "Lịch",
        nameEn: "Calendars",
        groupSlug: "van-phong-pham",
        groupName: "Văn phòng phẩm",
      },
      {
        id: "672266f3-0dd3-4a9f-a0b5-5ce4c988d1a3",
        slug: "van-phong-pham-khac",
        legacyId: "cat-van-phong-pham-khac",
        name: "Văn phòng phẩm khác",
        nameEn: "Other stationery",
        groupSlug: "van-phong-pham",
        groupName: "Văn phòng phẩm",
      },
    ],
  },
  {
    id: "e5cf9be9-2a89-47f0-a4a2-08cdc479240f",
    slug: "qua-tang",
    legacyId: "cat-qua-tang",
    name: "Quà tặng & Lưu niệm",
    nameEn: "Gifts & Souvenirs",
    items: [
      {
        id: "e1cf0f77-d9fb-4c8c-ac8c-bdf557d29997",
        slug: "thiep",
        legacyId: "cat-thiep",
        name: "Thiệp",
        nameEn: "Greeting cards",
        groupSlug: "qua-tang",
        groupName: "Quà tặng & Lưu niệm",
      },
      {
        id: "79d0646c-0c8f-41b3-ab72-66767baa7a16",
        slug: "buu-thiep",
        legacyId: "cat-buu-thiep",
        name: "Bưu thiếp",
        nameEn: "Postcards",
        groupSlug: "qua-tang",
        groupName: "Quà tặng & Lưu niệm",
      },
      {
        id: "7ee3378a-29a0-4ab6-a2c5-ff8dd734b847",
        slug: "nam-cham",
        legacyId: "cat-nam-cham",
        name: "Nam châm",
        nameEn: "Magnets",
        groupSlug: "qua-tang",
        groupName: "Quà tặng & Lưu niệm",
      },
      {
        id: "3f3ea15f-bbcc-465b-a041-818bd4bfa4de",
        slug: "moc-khoa",
        legacyId: "cat-moc-khoa",
        name: "Móc khoá",
        nameEn: "Keyrings",
        groupSlug: "qua-tang",
        groupName: "Quà tặng & Lưu niệm",
      },
      {
        id: "6488d5dd-f98a-4221-ae35-a0e32f790d6c",
        slug: "hinh-dan",
        legacyId: "cat-hinh-dan",
        name: "Hình dán",
        nameEn: "Stickers",
        groupSlug: "qua-tang",
        groupName: "Quà tặng & Lưu niệm",
      },
      {
        id: "e7ed62b1-dc3a-4192-a815-6a1c6bf88cbb",
        slug: "dac-san",
        legacyId: "cat-dac-san",
        name: "Đặc sản",
        nameEn: "Regional specialties",
        groupSlug: "qua-tang",
        groupName: "Quà tặng & Lưu niệm",
      },
    ],
  },
  {
    id: "5f7bc257-aadc-4fce-a08e-837c45c0732e",
    slug: "noi-that",
    legacyId: "cat-noi-that",
    name: "Nội thất & Không gian",
    nameEn: "Interiors",
    items: [
      {
        id: "57637826-9d63-4fd3-ab43-2924814c2425",
        slug: "dung-cu-an-uong",
        legacyId: "cat-dung-cu-an-uong",
        name: "Dụng cụ ăn uống",
        nameEn: "Tableware",
        groupSlug: "noi-that",
        groupName: "Nội thất & Không gian",
      },
      {
        id: "f29ae74f-ff96-4fde-a09e-49e6ced7d5e5",
        slug: "trang-tri",
        legacyId: "cat-trang-tri",
        name: "Trang trí",
        nameEn: "Decor",
        groupSlug: "noi-that",
        groupName: "Nội thất & Không gian",
      },
      {
        id: "0670a132-e8c5-4c23-abbf-1f35e313dfab",
        slug: "den",
        legacyId: "cat-den",
        name: "Đèn",
        nameEn: "Lighting",
        groupSlug: "noi-that",
        groupName: "Nội thất & Không gian",
      },
      {
        id: "fcf68c8d-2cfd-420b-a582-c5522c9361c7",
        slug: "do-gom",
        legacyId: "cat-do-gom",
        name: "Đồ gốm",
        nameEn: "Ceramics",
        groupSlug: "noi-that",
        groupName: "Nội thất & Không gian",
      },
    ],
  },
  {
    id: "c12bb388-fa9a-49e9-a860-01e5819f766d",
    slug: "cham-soc-da",
    legacyId: "cat-cham-soc-da",
    name: "Dưỡng & Chăm sóc da",
    nameEn: "Skincare",
    items: [
      {
        id: "4a4c97e7-b3d4-4a3a-a641-888247c770ca",
        slug: "nuoc-hoa",
        legacyId: "cat-nuoc-hoa",
        name: "Nước hoa",
        nameEn: "Fragrance",
        groupSlug: "cham-soc-da",
        groupName: "Dưỡng & Chăm sóc da",
      },
      {
        id: "6a390459-d0d2-4d77-a2d6-74b51f9066bd",
        slug: "nen-thom",
        legacyId: "cat-nen-thom",
        name: "Nến thơm",
        nameEn: "Scented candles",
        groupSlug: "cham-soc-da",
        groupName: "Dưỡng & Chăm sóc da",
      },
      {
        id: "851ccc9a-59aa-45f5-a9b4-3337b40a0f64",
        slug: "tam-goi",
        legacyId: "cat-tam-goi",
        name: "Sản phẩm tắm - gội",
        nameEn: "Bath & hair",
        groupSlug: "cham-soc-da",
        groupName: "Dưỡng & Chăm sóc da",
      },
      {
        id: "f41b5fb6-e176-4b16-ae35-08a66f2bb82a",
        slug: "goi-chuom",
        legacyId: "cat-goi-chuom",
        name: "Gối chườm",
        nameEn: "Heat packs",
        groupSlug: "cham-soc-da",
        groupName: "Dưỡng & Chăm sóc da",
      },
      {
        id: "1c269045-5c03-44c9-a113-4a5e7d89d09e",
        slug: "duong-da",
        legacyId: "cat-duong-da",
        name: "Dưỡng da",
        nameEn: "Skincare",
        groupSlug: "cham-soc-da",
        groupName: "Dưỡng & Chăm sóc da",
      },
    ],
  },
  {
    id: "bf0a53d1-86b7-41df-a1c7-d9274fd7e069",
    slug: "giai-tri",
    legacyId: "cat-giai-tri",
    name: "Giải trí",
    nameEn: "Leisure",
    items: [
      {
        id: "dcb73edf-4c59-46c1-a8fe-79f1257e152e",
        slug: "bo-tro-choi",
        legacyId: "cat-bo-tro-choi",
        name: "Bộ trò chơi",
        nameEn: "Games",
        groupSlug: "giai-tri",
        groupName: "Giải trí",
      },
      {
        id: "c7bffde3-d66a-41fc-a3b0-3b831ac8cb6b",
        slug: "do-choi-thu-bong",
        legacyId: "cat-do-choi-thu-bong",
        name: "Đồ chơi/Thú bông",
        nameEn: "Toys & plush",
        groupSlug: "giai-tri",
        groupName: "Giải trí",
      },
      {
        id: "0c10ee75-5b58-4588-a721-735a8bbbcad6",
        slug: "sach-tap-chi",
        legacyId: "cat-sach-tap-chi",
        name: "Sách và tạp chí",
        nameEn: "Books & magazines",
        groupSlug: "giai-tri",
        groupName: "Giải trí",
      },
    ],
  },
];

export const ALL_LEAVES: CategoryLeafDef[] = TAXONOMY.flatMap((g) => g.items);

/**
 * Normalizes an arbitrary category string for comparison.
 */
function cleanKey(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/^cat-/, "")
    .replace(/[&/]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Finds a leaf category by ID, slug, legacy 'cat-*' ID, or Vietnamese/English name.
 */
export function findCategory(input: string | null | undefined): CategoryLeafDef | null {
  if (!input) return null;
  const raw = String(input).trim();
  const clean = cleanKey(raw);

  // 1. Direct match on UUID, slug, or legacyId
  const exact = ALL_LEAVES.find(
    (l) => l.id === raw || l.slug === raw || l.legacyId === raw || l.slug === clean
  );
  if (exact) return exact;

  // 2. Match by Vietnamese name (case-insensitive)
  const byName = ALL_LEAVES.find(
    (l) => cleanKey(l.name) === clean || cleanKey(l.nameEn) === clean
  );
  if (byName) return byName;

  // 3. Partial or accent-tolerant match
  return (
    ALL_LEAVES.find((l) => clean.includes(cleanKey(l.name)) || cleanKey(l.name).includes(clean)) ||
    null
  );
}

/**
 * Finds a parent group by ID, slug, legacy 'cat-*' ID, or Vietnamese/English name.
 */
export function findCategoryGroup(input: string | null | undefined): CategoryGroupDef | null {
  if (!input) return null;
  const raw = String(input).trim();
  const clean = cleanKey(raw);

  const exact = TAXONOMY.find(
    (g) => g.id === raw || g.slug === raw || g.legacyId === raw || g.slug === clean
  );
  if (exact) return exact;

  return (
    TAXONOMY.find(
      (g) =>
        cleanKey(g.name) === clean ||
        cleanKey(g.nameEn) === clean ||
        clean.includes(cleanKey(g.name)) ||
        cleanKey(g.name).includes(clean)
    ) || null
  );
}

/**
 * Resolves full category information for a product row.
 * Guarantees that categoryGroup and categoryGroupSlug are ALWAYS the parent group.
 */
export function resolveProductCategory(categoryInput: string | null | undefined): {
  category: string;
  categorySlug: string;
  categoryId: string;
  categoryGroup: string;
  categoryGroupSlug: string;
} {
  const leaf = findCategory(categoryInput);
  if (leaf) {
    return {
      category: leaf.name,
      categorySlug: leaf.slug,
      categoryId: leaf.id,
      categoryGroup: leaf.groupName,
      categoryGroupSlug: leaf.groupSlug,
    };
  }

  // If input matches a group rather than a leaf:
  const group = findCategoryGroup(categoryInput);
  if (group && group.items.length > 0) {
    const firstLeaf = group.items[0];
    return {
      category: firstLeaf.name,
      categorySlug: firstLeaf.slug,
      categoryId: firstLeaf.id,
      categoryGroup: group.name,
      categoryGroupSlug: group.slug,
    };
  }

  // Safe fallback to 'Đồ gốm' (first of Interiors)
  const fallback = ALL_LEAVES.find((l) => l.slug === "do-gom") || ALL_LEAVES[0];
  return {
    category: fallback.name,
    categorySlug: fallback.slug,
    categoryId: fallback.id,
    categoryGroup: fallback.groupName,
    categoryGroupSlug: fallback.groupSlug,
  };
}

/**
 * Returns user-friendly Vietnamese category name for display.
 */
export function getCategoryDisplayName(input: string | null | undefined): string {
  if (!input) return "—";
  const leaf = findCategory(input);
  if (leaf) return leaf.name;
  const group = findCategoryGroup(input);
  if (group) return group.name;
  return input;
}

/**
 * Formats the taxonomy into CategoryNode[] for tree UI consumers (like /products and Portal).
 */
export function getCanonicalCategoryTree() {
  return TAXONOMY.map((group) => ({
    id: group.id,
    slug: group.slug,
    name: group.name,
    nameEn: group.nameEn,
    children: group.items.map((leaf) => ({
      id: leaf.id,
      slug: leaf.slug,
      name: leaf.name,
      nameEn: leaf.nameEn,
      children: [],
    })),
  }));
}
