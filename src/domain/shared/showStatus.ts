/**
 * Unified show status for visibility/lifecycle management across all entities.
 * This field controls visibility ONLY - business logic status fields remain separate.
 *
 * - 'active': Visible in active lists
 * - 'archived': Hidden from active lists, visible in archive/history
 * - 'deleted': Hidden from all UI, pending permanent deletion
 */
export type ShowStatus = 'active' | 'archived' | 'deleted';

/**
 * Interface for entities that support show status
 */
export interface WithShowStatus {
  showStatus: ShowStatus;
}

// ============================================================================
// Predicates
// ============================================================================

export const isActive = <T extends WithShowStatus>(entity: T): boolean =>
  entity.showStatus === 'active';

export const isArchived = <T extends WithShowStatus>(entity: T): boolean =>
  entity.showStatus === 'archived';

export const isDeleted = <T extends WithShowStatus>(entity: T): boolean =>
  entity.showStatus === 'deleted';

export const isVisible = <T extends WithShowStatus>(entity: T): boolean =>
  entity.showStatus === 'active';

export const isHidden = <T extends WithShowStatus>(entity: T): boolean =>
  entity.showStatus !== 'active';

// ============================================================================
// Filters
// ============================================================================

/**
 * Filter to get only active items (for main lists)
 */
export const filterActive = <T extends WithShowStatus>(items: T[]): T[] =>
  items.filter((item) => item.showStatus === 'active');

/**
 * Filter to get only archived items (for archive/history screens)
 */
export const filterArchived = <T extends WithShowStatus>(items: T[]): T[] =>
  items.filter((item) => item.showStatus === 'archived');

/**
 * Filter to get only deleted items (for admin/debug purposes)
 */
export const filterDeleted = <T extends WithShowStatus>(items: T[]): T[] =>
  items.filter((item) => item.showStatus === 'deleted');

/**
 * Filter to exclude deleted items (active + archived)
 */
export const filterNotDeleted = <T extends WithShowStatus>(items: T[]): T[] =>
  items.filter((item) => item.showStatus !== 'deleted');

/**
 * Filter with custom options
 */
export interface ShowStatusFilterOptions {
  includeActive?: boolean;
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

export const filterByShowStatus = <T extends WithShowStatus>(
  items: T[],
  options: ShowStatusFilterOptions
): T[] => {
  const { includeActive = true, includeArchived = false, includeDeleted = false } = options;

  return items.filter((item) => {
    if (item.showStatus === 'active') return includeActive;
    if (item.showStatus === 'archived') return includeArchived;
    if (item.showStatus === 'deleted') return includeDeleted;
    return includeActive; // Default for undefined
  });
};

// ============================================================================
// Backward compatibility helpers (for migration period)
// ============================================================================

/**
 * Derive showStatus from legacy fields during migration
 * This helps maintain compatibility with existing data
 */
export const deriveShowStatus = (entity: {
  status?: string;
  isArchived?: boolean;
  deletedAt?: string | Date | null;
}): ShowStatus => {
  // Check deletedAt first (highest priority)
  if (entity.deletedAt) {
    return 'deleted';
  }

  // Check isArchived boolean
  if (entity.isArchived) {
    return 'archived';
  }

  // Check status string
  if (entity.status === 'archived') {
    return 'archived';
  }
  if (entity.status === 'deleted') {
    return 'deleted';
  }

  return 'active';
};

/**
 * Get showStatus with fallback to derived value (for migration period)
 * Use this when showStatus might not be set yet
 */
export const getShowStatus = <
  T extends {
    showStatus?: ShowStatus;
    status?: string;
    isArchived?: boolean;
    deletedAt?: string | Date | null;
  }
>(
  entity: T
): ShowStatus => {
  if (entity.showStatus) {
    return entity.showStatus;
  }
  return deriveShowStatus(entity);
};

/**
 * Filter active with backward compatibility
 * Falls back to deriving showStatus from legacy fields
 */
export const filterActiveCompat = <
  T extends {
    showStatus?: ShowStatus;
    status?: string;
    isArchived?: boolean;
    deletedAt?: string | Date | null;
  }
>(
  items: T[]
): T[] => items.filter((item) => getShowStatus(item) === 'active');

/**
 * Filter archived with backward compatibility
 */
export const filterArchivedCompat = <
  T extends {
    showStatus?: ShowStatus;
    status?: string;
    isArchived?: boolean;
    deletedAt?: string | Date | null;
  }
>(
  items: T[]
): T[] => items.filter((item) => getShowStatus(item) === 'archived');
