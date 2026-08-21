import Ionicons from '@expo/vector-icons/Ionicons';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthorityComplaints } from '@/components/authority/authority-complaints-context';
import AuthorityFilterChip from '@/components/authority/authority-filter-chip';
import AuthorityPageHeader from '@/components/authority/authority-page-header';

import {
  type AuthorityComplaint,
  type AuthorityComplaintStatus,
} from '@/components/authority/store-authority-dashboard';

type ComplaintFilter =
  | 'ALL'
  | AuthorityComplaintStatus;

type ComplaintSearchParams = {
  status?: string | string[];
  query?: string | string[];
};

const filters: {
  label: string;
  value: ComplaintFilter;
}[] = [
  {
    label: 'All',
    value: 'ALL',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'In Progress',
    value: 'IN PROGRESS',
  },
  {
    label: 'Resolved',
    value: 'RESOLVED',
  },
];

const statusOrder: AuthorityComplaintStatus[] = [
  'PENDING',
  'IN PROGRESS',
  'RESOLVED',
];

const getFirstParam = (
  value?: string | string[],
) =>
  Array.isArray(value)
    ? value[0] ?? ''
    : value ?? '';

const matchesComplaintSearch = (
  complaint: AuthorityComplaint,
  keyword: string,
) => {
  if (!keyword) {
    return true;
  }

  return (
    complaint.title
      .toLowerCase()
      .includes(keyword) ||
    complaint.description
      .toLowerCase()
      .includes(keyword) ||
    complaint.location
      .toLowerCase()
      .includes(keyword) ||
    complaint.category
      .toLowerCase()
      .includes(keyword) ||
    complaint.id
      .toLowerCase()
      .includes(keyword)
  );
};

const statusTheme: Record<
  AuthorityComplaintStatus,
  {
    color: string;
    background: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  PENDING: {
    color: '#EF4444',
    background: '#FEF2F2',
    icon: 'time-outline',
  },

  'IN PROGRESS': {
    color: '#C67B00',
    background: '#FFF7E8',
    icon: 'construct-outline',
  },

  RESOLVED: {
    color: '#2563EB',
    background: '#EFF6FF',
    icon: 'checkmark-circle-outline',
  },
};

function getStatusLabel(
  status: AuthorityComplaintStatus,
) {
  if (status === 'IN PROGRESS') {
    return 'In Progress';
  }

  if (status === 'PENDING') {
    return 'Pending';
  }

  return 'Resolved';
}

export default function AuthorityAllComplaints() {
  const router = useRouter();

  const {
    complaints,
    loading,
    error,
    refreshComplaints,
    clearError,
  } = useAuthorityComplaints();

  const params =
    useLocalSearchParams<ComplaintSearchParams>();

  const statusParam = getFirstParam(
    params.status,
  );

  const search = getFirstParam(
    params.query,
  );

  const filter: ComplaintFilter =
    filters.some(
      (item) =>
        item.value === statusParam,
    )
      ? (statusParam as ComplaintFilter)
      : 'ALL';

  const updateFilters = (
    updates: Record<string, string>,
  ) => {
    router.setParams(
      updates as never,
    );
  };

  /*
   * Real complaints from Supabase are filtered
   * only by:
   *
   * 1. Status
   * 2. Search keyword
   *
   * No Category or Area filter exists here.
   */
  const filteredComplaints =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase();

      return [...complaints]
        .filter(
          (complaint) =>
            filter === 'ALL' ||
            complaint.status === filter,
        )
        .filter((complaint) =>
          matchesComplaintSearch(
            complaint,
            keyword,
          ),
        )
        .sort(
          (first, second) =>
            second.urgency -
            first.urgency,
        );
    }, [
      complaints,
      filter,
      search,
    ]);

  /*
   * Counts shown beside:
   *
   * All
   * Pending
   * In Progress
   * Resolved
   *
   * Search is respected when calculating
   * these counts.
   */
  const statusCounts =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase();

      const matchingComplaints =
        complaints.filter(
          (complaint) =>
            matchesComplaintSearch(
              complaint,
              keyword,
            ),
        );

      return {
        ALL: matchingComplaints.length,

        PENDING:
          matchingComplaints.filter(
            (complaint) =>
              complaint.status ===
              'PENDING',
          ).length,

        'IN PROGRESS':
          matchingComplaints.filter(
            (complaint) =>
              complaint.status ===
              'IN PROGRESS',
          ).length,

        RESOLVED:
          matchingComplaints.filter(
            (complaint) =>
              complaint.status ===
              'RESOLVED',
          ).length,
      } satisfies Record<
        ComplaintFilter,
        number
      >;
    }, [
      complaints,
      search,
    ]);

  const openComplaint = (
    complaint: AuthorityComplaint,
  ) => {
    router.push({
      pathname:
        '/authority/complaints/[complaintId]',

      params: {
        complaintId:
          complaint.id,
      },
    } as never);
  };

  /*
   * Complaints remain visually grouped
   * according to their database status.
   */
  const sections =
    useMemo(
      () =>
        statusOrder
          .map((status) => ({
            status,

            complaints:
              filteredComplaints.filter(
                (complaint) =>
                  complaint.status ===
                  status,
              ),
          }))
          .filter(
            (section) =>
              section.complaints
                .length > 0,
          ),
      [filteredComplaints],
    );

  const clearAllFilters = () => {
    updateFilters({
      status: '',
      query: '',
    });
  };

  const handleRetry = async () => {
    clearError();
    await refreshComplaints();
  };

  return (
    <SafeAreaView
      edges={[
        'top',
        'left',
        'right',
      ]}
      style={styles.safeArea}
    >
      <AuthorityPageHeader
        title="Home"
        icon="home-outline"
        onBack={() =>
          router.navigate(
            '/authority/dashboard' as never,
          )
        }
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <View
          style={
            styles.container
          }
        >
          {/* Header */}

          <View style={styles.hero}>
            <Text
              style={
                styles.eyebrow
              }
            >
              AUTHORITY COMPLAINTS
            </Text>

            <Text
              style={styles.title}
            >
              All Complaints
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Review verified
              complaints and track
              their progress from
              pending to resolution.
            </Text>
          </View>

          {/* Backend error banner */}

          {!!error &&
            complaints.length > 0 && (
              <View
                style={
                  styles.errorBanner
                }
              >
                <View
                  style={
                    styles.errorBannerIcon
                  }
                >
                  <Ionicons
                    name="warning-outline"
                    size={18}
                    color="#B42318"
                  />
                </View>

                <View
                  style={
                    styles.errorBannerCopy
                  }
                >
                  <Text
                    style={
                      styles.errorBannerTitle
                    }
                  >
                    Could not refresh
                    complaints
                  </Text>

                  <Text
                    style={
                      styles.errorBannerText
                    }
                  >
                    {error}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={
                    handleRetry
                  }
                  style={
                    styles.retrySmallButton
                  }
                >
                  <Text
                    style={
                      styles.retrySmallText
                    }
                  >
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          {/* Search + Status */}

          <View
            style={
              styles.controls
            }
          >
            <View
              style={
                styles.searchBox
              }
            >
              <Ionicons
                name="search-outline"
                size={18}
                color="#7A8493"
              />

              <TextInput
                value={search}
                onChangeText={(
                  value,
                ) =>
                  updateFilters({
                    query:
                      value,
                  })
                }
                placeholder="Search title, category, location or complaint ID"
                placeholderTextColor="#9AA2AE"
                style={
                  styles.searchInput
                }
              />

              {!!search && (
                <Pressable
                  onPress={() =>
                    updateFilters(
                      {
                        query:
                          '',
                      },
                    )
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="#9AA2AE"
                  />
                </Pressable>
              )}
            </View>

            <View
              style={
                styles.filterGroup
              }
            >
              <Text
                style={
                  styles.filterLabel
                }
              >
                Status
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filters
                }
              >
                {filters.map(
                  (item) => {
                    const active =
                      filter ===
                      item.value;

                    const count =
                      statusCounts[
                        item.value
                      ];

                    return (
                      <AuthorityFilterChip
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        count={
                          count
                        }
                        active={
                          active
                        }
                        disabled={
                          !active &&
                          item.value !==
                            'ALL' &&
                          count ===
                            0
                        }
                        onPress={() =>
                          updateFilters(
                            {
                              status:
                                item.value ===
                                'ALL'
                                  ? ''
                                  : item.value,
                            },
                          )
                        }
                      />
                    );
                  },
                )}
              </ScrollView>
            </View>
          </View>

          {/* Initial loading */}

          {loading &&
            complaints.length ===
              0 && (
              <View
                style={
                  styles.loadingState
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#23435D"
                />

                <Text
                  style={
                    styles.loadingTitle
                  }
                >
                  Loading complaints
                </Text>

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Fetching verified
                  complaints from the
                  database...
                </Text>
              </View>
            )}

          {/* Initial database error */}

          {!loading &&
            error &&
            complaints.length ===
              0 && (
              <View
                style={
                  styles.errorState
                }
              >
                <View
                  style={
                    styles.errorIcon
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={32}
                    color="#B42318"
                  />
                </View>

                <Text
                  style={
                    styles.errorTitle
                  }
                >
                  Could not load
                  complaints
                </Text>

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>

                <TouchableOpacity
                  style={
                    styles.retryButton
                  }
                  onPress={
                    handleRetry
                  }
                >
                  <Ionicons
                    name="refresh-outline"
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.retryButtonText
                    }
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          {/* Actual complaint data */}

          {!loading ||
          complaints.length > 0 ? (
            <>
              {!(
                error &&
                complaints.length ===
                  0
              ) && (
                <>
                  <View
                    style={
                      styles.resultSummary
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.resultText
                        }
                      >
                        {
                          filteredComplaints.length
                        }{' '}
                        {filteredComplaints.length ===
                        1
                          ? 'complaint'
                          : 'complaints'}{' '}
                        found
                      </Text>

                      {(filter !==
                        'ALL' ||
                        search.length >
                          0) && (
                        <Pressable
                          onPress={
                            clearAllFilters
                          }
                          style={
                            styles.clearFilters
                          }
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={
                              13
                            }
                            color="#2563EB"
                          />

                          <Text
                            style={
                              styles.clearFiltersText
                            }
                          >
                            Clear
                            filters
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    <View
                      style={
                        styles.sortBadge
                      }
                    >
                      <Ionicons
                        name="arrow-down-outline"
                        size={13}
                        color="#A7640C"
                      />

                      <Text
                        style={
                          styles.sortText
                        }
                      >
                        Urgency:
                        highest first
                      </Text>
                    </View>
                  </View>

                  {/* Status sections */}

                  {sections.map(
                    (section) => {
                      const theme =
                        statusTheme[
                          section
                            .status
                        ];

                      return (
                        <View
                          key={
                            section.status
                          }
                          style={
                            styles.section
                          }
                        >
                          <View
                            style={
                              styles.sectionHeader
                            }
                          >
                            <View
                              style={[
                                styles.sectionIcon,
                                {
                                  backgroundColor:
                                    theme.background,
                                },
                              ]}
                            >
                              <Ionicons
                                name={
                                  theme.icon
                                }
                                size={
                                  19
                                }
                                color={
                                  theme.color
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.sectionHeadingCopy
                              }
                            >
                              <Text
                                style={
                                  styles.sectionTitle
                                }
                              >
                                {getStatusLabel(
                                  section.status,
                                )}
                              </Text>

                              <Text
                                style={
                                  styles.sectionCount
                                }
                              >
                                {
                                  section
                                    .complaints
                                    .length
                                }{' '}
                                {section
                                  .complaints
                                  .length ===
                                1
                                  ? 'complaint'
                                  : 'complaints'}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={
                              styles.complaintList
                            }
                          >
                            {section.complaints.map(
                              (
                                complaint,
                              ) => (
                                <Pressable
                                  key={
                                    complaint.id
                                  }
                                  onPress={() =>
                                    openComplaint(
                                      complaint,
                                    )
                                  }
                                  style={({
                                    pressed,
                                  }) => [
                                    styles.complaintCard,
                                    pressed &&
                                      styles.complaintCardPressed,
                                  ]}
                                >
                                  <View
                                    style={
                                      styles.complaintMain
                                    }
                                  >
                                    <View
                                      style={
                                        styles.complaintTopLine
                                      }
                                    >
                                      <Text
                                        style={
                                          styles.complaintTitle
                                        }
                                        numberOfLines={
                                          1
                                        }
                                      >
                                        {
                                          complaint.title
                                        }
                                      </Text>

                                      <View
                                        style={[
                                          styles.statusBadge,
                                          {
                                            backgroundColor:
                                              theme.background,
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.statusText,
                                            {
                                              color:
                                                theme.color,
                                            },
                                          ]}
                                        >
                                          {
                                            complaint.status
                                          }
                                        </Text>
                                      </View>
                                    </View>

                                    <Text
                                      style={
                                        styles.complaintDescription
                                      }
                                      numberOfLines={
                                        2
                                      }
                                    >
                                      {
                                        complaint.description
                                      }
                                    </Text>

                                    <View
                                      style={
                                        styles.metaRow
                                      }
                                    >
                                      <View
                                        style={
                                          styles.metaItem
                                        }
                                      >
                                        <Ionicons
                                          name="document-text-outline"
                                          size={
                                            12
                                          }
                                          color="#3B82F6"
                                        />

                                        <Text
                                          style={
                                            styles.complaintId
                                          }
                                          numberOfLines={
                                            1
                                          }
                                        >
                                          {
                                            complaint.id
                                          }
                                        </Text>
                                      </View>

                                      <View
                                        style={
                                          styles.metaItem
                                        }
                                      >
                                        <Ionicons
                                          name="layers-outline"
                                          size={
                                            12
                                          }
                                          color="#7A8493"
                                        />

                                        <Text
                                          style={
                                            styles.metaText
                                          }
                                        >
                                          {
                                            complaint.category
                                          }
                                        </Text>
                                      </View>

                                      <View
                                        style={
                                          styles.metaItem
                                        }
                                      >
                                        <Ionicons
                                          name="location-outline"
                                          size={
                                            12
                                          }
                                          color="#7A8493"
                                        />

                                        <Text
                                          style={
                                            styles.metaText
                                          }
                                        >
                                          {
                                            complaint.location
                                          }
                                        </Text>
                                      </View>

                                      <View
                                        style={
                                          styles.metaItem
                                        }
                                      >
                                        <Ionicons
                                          name="calendar-outline"
                                          size={
                                            12
                                          }
                                          color="#7A8493"
                                        />

                                        <Text
                                          style={
                                            styles.metaText
                                          }
                                        >
                                          {
                                            complaint.date
                                          }
                                        </Text>
                                      </View>
                                    </View>
                                  </View>

                                  <View
                                    style={
                                      styles.urgencyBadge
                                    }
                                  >
                                    <Ionicons
                                      name="arrow-up-circle"
                                      size={
                                        17
                                      }
                                      color="#C57C1B"
                                    />

                                    <Text
                                      style={
                                        styles.urgencyValue
                                      }
                                    >
                                      {
                                        complaint.urgency
                                      }
                                    </Text>

                                    <Text
                                      style={
                                        styles.urgencyLabel
                                      }
                                    >
                                      urgency
                                    </Text>
                                  </View>

                                  <Ionicons
                                    name="chevron-forward"
                                    size={
                                      18
                                    }
                                    color="#A7AFBA"
                                  />
                                </Pressable>
                              ),
                            )}
                          </View>
                        </View>
                      );
                    },
                  )}

                  {/* Empty state */}

                  {filteredComplaints.length ===
                    0 && (
                    <View
                      style={
                        styles.emptyState
                      }
                    >
                      <Ionicons
                        name="documents-outline"
                        size={32}
                        color="#99A2AE"
                      />

                      <Text
                        style={
                          styles.emptyTitle
                        }
                      >
                        No complaints
                        found
                      </Text>

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        {complaints.length ===
                        0
                          ? 'There are currently no pending, in-progress, or resolved complaints available to the authority.'
                          : 'Try another status or search keyword.'}
                      </Text>

                      {(filter !==
                        'ALL' ||
                        search.length >
                          0) && (
                        <TouchableOpacity
                          onPress={
                            clearAllFilters
                          }
                          style={
                            styles.emptyResetButton
                          }
                        >
                          <Ionicons
                            name="refresh-outline"
                            size={
                              15
                            }
                            color="#23435D"
                          />

                          <Text
                            style={
                              styles.emptyResetText
                            }
                          >
                            Reset
                            Filters
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#F7F8FA',
    },

    scrollContent: {
      paddingBottom: 34,
    },

    container: {
      width: '100%',
      maxWidth: 1080,
      alignSelf: 'center',
      padding: 16,
      gap: 17,
    },

    hero: {
      gap: 3,
    },

    eyebrow: {
      color: '#B9854B',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    title: {
      color: '#111827',
      fontSize: 25,
      fontWeight: '800',
    },

    subtitle: {
      color: '#6B7280',
      fontSize: 12,
      marginTop: 3,
      lineHeight: 18,
    },

    controls: {
      gap: 11,
    },

    searchBox: {
      flex: 1,
      minWidth: 260,
      minHeight: 43,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E2E6EB',
    },

    searchInput: {
      flex: 1,
      color: '#344054',
      fontSize: 11,
    },

    filterGroup: {
      gap: 6,
    },

    filterLabel: {
      color: '#475467',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    filters: {
      gap: 7,
    },

    resultSummary: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },

    resultText: {
      color: '#667085',
      fontSize: 10,
      fontWeight: '700',
    },

    clearFilters: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 5,
    },

    clearFiltersText: {
      color: '#2563EB',
      fontSize: 9,
      fontWeight: '700',
    },

    sortBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor:
        '#FFF7E8',
    },

    sortText: {
      color: '#A7640C',
      fontSize: 9,
      fontWeight: '700',
    },

    section: {
      gap: 10,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    sectionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    sectionHeadingCopy: {
      flex: 1,
    },

    sectionTitle: {
      color: '#1F2937',
      fontSize: 16,
      fontWeight: '800',
    },

    sectionCount: {
      color: '#8A93A1',
      fontSize: 9,
      marginTop: 2,
    },

    complaintList: {
      gap: 9,
    },

    complaintCard: {
      minHeight: 94,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 13,
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#EAEDF1',
      boxShadow:
        '0 2px 8px rgba(0,0,0,0.04)',
    },

    complaintCardPressed: {
      opacity: 0.76,
    },

    complaintMain: {
      flex: 1,
      minWidth: 0,
    },

    complaintTopLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    complaintTitle: {
      flex: 1,
      color: '#263142',
      fontSize: 13,
      fontWeight: '800',
    },

    complaintDescription: {
      color: '#687386',
      fontSize: 10,
      lineHeight: 15,
      marginTop: 4,
    },

    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 10,
    },

    statusText: {
      fontSize: 8,
      fontWeight: '800',
    },

    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },

    complaintId: {
      maxWidth: 160,
      color: '#3B82F6',
      fontSize: 9,
      fontWeight: '800',
    },

    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    metaText: {
      color: '#7A8493',
      fontSize: 9,
    },

    urgencyBadge: {
      alignItems: 'center',
      minWidth: 48,
      padding: 7,
      borderRadius: 11,
      backgroundColor:
        '#FFF7E8',
    },

    urgencyValue: {
      color: '#A7640C',
      fontSize: 13,
      fontWeight: '900',
      fontVariant: [
        'tabular-nums',
      ],
    },

    urgencyLabel: {
      color: '#A77C45',
      fontSize: 7,
      fontWeight: '700',
    },

    loadingState: {
      minHeight: 230,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 30,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#ECEFF3',
    },

    loadingTitle: {
      color: '#344054',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 13,
    },

    loadingText: {
      color: '#8A93A1',
      fontSize: 10,
      marginTop: 5,
      textAlign: 'center',
    },

    errorState: {
      alignItems: 'center',
      padding: 35,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#F3D0CC',
    },

    errorIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FEF3F2',
    },

    errorTitle: {
      color: '#344054',
      fontSize: 15,
      fontWeight: '800',
      marginTop: 12,
    },

    errorText: {
      maxWidth: 520,
      color: '#7A8493',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 5,
    },

    retryButton: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      paddingHorizontal: 18,
      marginTop: 16,
      borderRadius: 20,
      backgroundColor:
        '#23435D',
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor:
        '#FEF3F2',
      borderWidth: 1,
      borderColor:
        '#F3D0CC',
    },

    errorBannerIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FEE4E2',
    },

    errorBannerCopy: {
      flex: 1,
    },

    errorBannerTitle: {
      color: '#912018',
      fontSize: 10,
      fontWeight: '800',
    },

    errorBannerText: {
      color: '#B5473D',
      fontSize: 8,
      marginTop: 2,
    },

    retrySmallButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#F3D0CC',
    },

    retrySmallText: {
      color: '#B42318',
      fontSize: 9,
      fontWeight: '800',
    },

    emptyState: {
      alignItems: 'center',
      padding: 35,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#ECEFF3',
    },

    emptyTitle: {
      color: '#344054',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 9,
    },

    emptyText: {
      maxWidth: 500,
      color: '#8A93A1',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 4,
    },

    emptyResetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      marginTop: 12,
      borderRadius: 16,
      backgroundColor:
        '#F0F5F7',
    },

    emptyResetText: {
      color: '#23435D',
      fontSize: 9,
      fontWeight: '800',
    },
  });