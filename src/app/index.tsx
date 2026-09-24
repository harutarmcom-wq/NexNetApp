import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

type Product = {
  id: number;
  name: string;
  model: string;
  brand: string;
  type: string;
  megapixel: string;
  price: number;
  image_url?: string | null;
  description?: string;
  category?: string;
  channels?: string;
  ports?: string;
  capacity?: string;
};

type CartItem = Product & {
  quantity: number;
};

// Ժամանակավոր ապրանքներ՝ դիզայնը ստուգելու համար
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Dahua IP Camera 4MP',
    model: 'DH-IPC-B1B40P',
    brand: 'Dahua',
    type: 'IP Camera',
    megapixel: '4MP',
    price: 35000,
    description:
      '4MP IP տեսախցիկ՝ արտաքին և ներքին տեսահսկման համակարգերի համար։',
    category: 'Տեսահսկում',
  },
  {
    id: 2,
    name: 'Dahua Full Color Camera',
    model: 'DH-IPC-HFW2549SP-S-IL-0280B',
    brand: 'Dahua',
    type: 'IP Camera',
    megapixel: '5MP',
    price: 52000,
    description:
      'Full Color IP տեսախցիկ՝ բարձր որակի գիշերային պատկերմամբ։',
    category: 'Տեսահսկում',
  },
  {
    id: 3,
    name: 'Dahua 8MP Camera',
    model: 'DH-IPC-HFW2849SP-S-IL-0280B',
    brand: 'Dahua',
    type: 'IP Camera',
    megapixel: '8MP',
    price: 68000,
    description:
      '8MP բարձր լուծաչափով IP տեսախցիկ՝ պրոֆեսիոնալ տեսահսկման համար։',
    category: 'Տեսահսկում',
  },
];

function formatPrice(price: number) {
  return `${price.toLocaleString('hy-AM')} ֏`;
}

function isNewerVersion(
  latest: string,
  current: string
) {
  const latestParts = latest
    .split('.')
    .map(Number);

  const currentParts = current
    .split('.')
    .map(Number);

  for (let i = 0; i < 3; i++) {
    const latestNumber = latestParts[i] || 0;
    const currentNumber = currentParts[i] || 0;

    if (latestNumber > currentNumber) {
      return true;
    }

    if (latestNumber < currentNumber) {
      return false;
    }
  }

  return false;
}

export default function HomeScreen() {
  const [products] = useState<Product[]>(PRODUCTS);

  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [cartVisible, setCartVisible] = useState(false);

  // =========================
  // UPDATE SYSTEM
  // =========================

  const [updateAvailable, setUpdateAvailable] =
    useState(false);

  const [latestVersion, setLatestVersion] =
    useState('');

  const [apkUrl, setApkUrl] =
    useState('');

  const [downloadingUpdate, setDownloadingUpdate] =
    useState(false);

  const CURRENT_VERSION =
    Constants.expoConfig?.version || '1.0.0';

  const UPDATE_URL =
    'https://raw.githubusercontent.com/harutarmcom-wq/NexNetApp/main/update.json';

  async function checkForUpdate() {
    try {
      const response = await fetch(
        `${UPDATE_URL}?t=${Date.now()}`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (
        data.version &&
        data.apkUrl &&
        isNewerVersion(
          data.version,
          CURRENT_VERSION
        )
      ) {
        setLatestVersion(data.version);
        setApkUrl(data.apkUrl);
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.log(
        'Update check failed:',
        error
      );
    }
  }

  async function downloadAndInstallUpdate() {
    if (!apkUrl || downloadingUpdate) {
      return;
    }

    try {
      setDownloadingUpdate(true);

      const apkPath =
        `${FileSystem.cacheDirectory}NEXNET-${latestVersion}.apk`;

      const downloadResult =
        await FileSystem.downloadAsync(
          apkUrl,
          apkPath
        );

      if (!downloadResult.uri) {
        throw new Error(
          'APK download failed'
        );
      }

      const contentUri =
        await FileSystem.getContentUriAsync(
          downloadResult.uri
        );

      await Linking.openURL(contentUri);
    } catch (error) {
      console.error(
        'APK update error:',
        error
      );

      Alert.alert(
        'Թարմացում',
        'Նոր տարբերակը ներբեռնել չհաջողվեց։'
      );
    } finally {
      setDownloadingUpdate(false);
    }
  }

  useEffect(() => {
    checkForUpdate();
  }, []);

  // =========================
  // SEARCH
  // =========================

  const filteredProducts = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name
          .toLowerCase()
          .includes(value) ||
        product.model
          .toLowerCase()
          .includes(value) ||
        product.brand
          .toLowerCase()
          .includes(value) ||
        product.type
          .toLowerCase()
          .includes(value)
      );
    });
  }, [products, search]);

  // =========================
  // CART
  // =========================

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    Alert.alert(
      'Ավելացվեց',
      'Ապրանքը ավելացվեց զամբյուղում։'
    );
  }

  function increaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );
  }

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

  // =========================
  // UI
  // =========================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* UPDATE BANNER */}

      {updateAvailable && (
        <View style={styles.updateBanner}>
          <View
            style={
              styles.updateTextContainer
            }
          >
            <Text
              style={styles.updateTitle}
            >
              Նոր տարբերակ կա
            </Text>

            <Text
              style={styles.updateSubtitle}
            >
              NEXNET {latestVersion}
            </Text>
          </View>

          <Pressable
            style={styles.updateButton}
            onPress={
              downloadAndInstallUpdate
            }
            disabled={downloadingUpdate}
          >
            <Text
              style={
                styles.updateButtonText
              }
            >
              {downloadingUpdate
                ? 'Ներբեռնում...'
                : 'Թարմացնել'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            NEXNET
          </Text>

          <Text
            style={styles.logoSubtitle}
          >
            IT • NETWORK • SECURITY
          </Text>
        </View>

        <Pressable
          style={styles.cartButton}
          onPress={() =>
            setCartVisible(true)
          }
        >
          <Text
            style={styles.cartButtonText}
          >
            🛒 {cartCount}
          </Text>
        </Pressable>
      </View>

      {/* SEARCH */}

      <View
        style={styles.searchContainer}
      >
        <Text
          style={styles.searchIcon}
        >
          🔎
        </Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Փնտրել ապրանք..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      </View>

      {/* CATALOG HEADER */}

      <View
        style={styles.catalogHeader}
      >
        <View>
          <Text
            style={styles.catalogTitle}
          >
            Ապրանքներ
          </Text>

          <Text
            style={styles.catalogSubtitle}
          >
            Տեսահսկում • Ցանցային սարքեր • IT
          </Text>
        </View>

        <Text
          style={styles.productCount}
        >
          {filteredProducts.length}
        </Text>
      </View>

      {/* PRODUCTS */}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) =>
          String(item.id)
        }
        contentContainerStyle={
          styles.productList
        }
        showsVerticalScrollIndicator={
          false
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.productCard}
            onPress={() =>
              setSelectedProduct(item)
            }
          >
            <View
              style={
                styles.imageContainer
              }
            >
              {item.image_url ? (
                <Image
                  source={{
                    uri: item.image_url,
                  }}
                  style={
                    styles.productImage
                  }
                  resizeMode="contain"
                />
              ) : (
                <Text
                  style={styles.noImage}
                >
                  📷
                </Text>
              )}
            </View>

            <View
              style={styles.productInfo}
            >
              <Text
                style={styles.productType}
              >
                {item.type}
              </Text>

              <Text
                style={styles.productName}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <Text
                style={
                  styles.productModel
                }
              >
                {item.model}
              </Text>

              <Text
                style={
                  styles.productMegapixel
                }
              >
                {item.megapixel}
              </Text>

              <View
                style={styles.cardBottom}
              >
                <Text
                  style={
                    styles.productPrice
                  }
                >
                  {formatPrice(
                    item.price
                  )}
                </Text>

                <Pressable
                  style={styles.addButton}
                  onPress={(event) => {
                    event.stopPropagation();
                    addToCart(item);
                  }}
                >
                  <Text
                    style={
                      styles.addButtonText
                    }
                  >
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={styles.emptyIcon}
            >
              🔎
            </Text>

            <Text
              style={styles.emptyText}
            >
              Ապրանք չի գտնվել
            </Text>
          </View>
        }
      />

      {/* PRODUCT DETAILS */}

      <Modal
        visible={
          selectedProduct !== null
        }
        animationType="slide"
        onRequestClose={() =>
          setSelectedProduct(null)
        }
      >
        {selectedProduct && (
          <SafeAreaView
            style={styles.modalContainer}
          >
            <View
              style={styles.modalHeader}
            >
              <Pressable
                onPress={() =>
                  setSelectedProduct(null)
                }
              >
                <Text
                  style={styles.backButton}
                >
                  ‹
                </Text>
              </Pressable>

              <Text
                style={
                  styles.modalHeaderTitle
                }
              >
                Ապրանքի մանրամասներ
              </Text>

              <View
                style={{ width: 40 }}
              />
            </View>

            <ScrollView
              contentContainerStyle={
                styles.detailsContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              <View
                style={
                  styles.detailsImageContainer
                }
              >
                {selectedProduct.image_url ? (
                  <Image
                    source={{
                      uri: selectedProduct.image_url,
                    }}
                    style={
                      styles.detailsImage
                    }
                    resizeMode="contain"
                  />
                ) : (
                  <Text
                    style={
                      styles.detailsNoImage
                    }
                  >
                    📷
                  </Text>
                )}
              </View>

              <Text
                style={styles.detailsType}
              >
                {selectedProduct.type}
              </Text>

              <Text
                style={styles.detailsName}
              >
                {selectedProduct.name}
              </Text>

              <Text
                style={styles.detailsModel}
              >
                {selectedProduct.model}
              </Text>

              <Text
                style={styles.detailsPrice}
              >
                {formatPrice(
                  selectedProduct.price
                )}
              </Text>

              <View
                style={styles.divider}
              />

              <Text
                style={styles.sectionTitle}
              >
                Տեխնիկական տվյալներ
              </Text>

              <View
                style={styles.specs}
              >
                <SpecRow
                  title="Բրենդ"
                  value={
                    selectedProduct.brand
                  }
                />

                <SpecRow
                  title="Մոդել"
                  value={
                    selectedProduct.model
                  }
                />

                <SpecRow
                  title="Տեսակ"
                  value={
                    selectedProduct.type
                  }
                />

                <SpecRow
                  title="Megapixel"
                  value={
                    selectedProduct.megapixel
                  }
                />

                {selectedProduct.channels && (
                  <SpecRow
                    title="Channels"
                    value={
                      selectedProduct.channels
                    }
                  />
                )}

                {selectedProduct.ports && (
                  <SpecRow
                    title="Ports"
                    value={
                      selectedProduct.ports
                    }
                  />
                )}

                {selectedProduct.capacity && (
                  <SpecRow
                    title="Capacity"
                    value={
                      selectedProduct.capacity
                    }
                  />
                )}

                {selectedProduct.category && (
                  <SpecRow
                    title="Կատեգորիա"
                    value={
                      selectedProduct.category
                    }
                  />
                )}
              </View>

              {selectedProduct.description && (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Նկարագրություն
                  </Text>

                  <Text
                    style={
                      styles.description
                    }
                  >
                    {
                      selectedProduct.description
                    }
                  </Text>
                </>
              )}

              <Pressable
                style={
                  styles.detailsAddButton
                }
                onPress={() =>
                  addToCart(
                    selectedProduct
                  )
                }
              >
                <Text
                  style={
                    styles.detailsAddButtonText
                  }
                >
                  🛒 Ավելացնել զամբյուղ
                </Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* CART */}

      <Modal
        visible={cartVisible}
        animationType="slide"
        onRequestClose={() =>
          setCartVisible(false)
        }
      >
        <SafeAreaView
          style={styles.modalContainer}
        >
          <View
            style={styles.modalHeader}
          >
            <Pressable
              onPress={() =>
                setCartVisible(false)
              }
            >
              <Text
                style={styles.backButton}
              >
                ‹
              </Text>
            </Pressable>

            <Text
              style={
                styles.modalHeaderTitle
              }
            >
              🛒 Զամբյուղ ({cartCount})
            </Text>

            <View
              style={{ width: 40 }}
            />
          </View>

          {cart.length === 0 ? (
            <View
              style={styles.emptyCart}
            >
              <Text
                style={
                  styles.emptyCartIcon
                }
              >
                🛒
              </Text>

              <Text
                style={
                  styles.emptyCartTitle
                }
              >
                Զամբյուղը դատարկ է
              </Text>

              <Text
                style={
                  styles.emptyCartText
                }
              >
                Ավելացրու ապրանքներ
                կատալոգից։
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={
                styles.cartContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {cart.map((item) => (
                <View
                  key={item.id}
                  style={styles.cartItem}
                >
                  <View
                    style={
                      styles.cartImageContainer
                    }
                  >
                    {item.image_url ? (
                      <Image
                        source={{
                          uri: item.image_url,
                        }}
                        style={
                          styles.cartImage
                        }
                        resizeMode="contain"
                      />
                    ) : (
                      <Text>📷</Text>
                    )}
                  </View>

                  <View
                    style={
                      styles.cartItemInfo
                    }
                  >
                    <Text
                      style={
                        styles.cartItemName
                      }
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={
                        styles.cartItemModel
                      }
                    >
                      {item.model}
                    </Text>

                    <Text
                      style={
                        styles.cartItemPrice
                      }
                    >
                      {formatPrice(
                        item.price
                      )}
                    </Text>

                    <View
                      style={
                        styles.quantityRow
                      }
                    >
                      <Pressable
                        style={
                          styles.quantityButton
                        }
                        onPress={() =>
                          decreaseQuantity(
                            item.id
                          )
                        }
                      >
                        <Text
                          style={
                            styles.quantityText
                          }
                        >
                          −
                        </Text>
                      </Pressable>

                      <Text
                        style={
                          styles.quantityValue
                        }
                      >
                        {item.quantity}
                      </Text>

                      <Pressable
                        style={
                          styles.quantityButton
                        }
                        onPress={() =>
                          increaseQuantity(
                            item.id
                          )
                        }
                      >
                        <Text
                          style={
                            styles.quantityText
                          }
                        >
                          +
                        </Text>
                      </Pressable>

                      <Text
                        style={
                          styles.itemTotal
                        }
                      >
                        {formatPrice(
                          item.price *
                            item.quantity
                        )}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        removeFromCart(
                          item.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.removeText
                        }
                      >
                        Հեռացնել
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              <View
                style={styles.summary}
              >
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Ամփոփում
                </Text>

                <View
                  style={styles.summaryRow}
                >
                  <Text>
                    Ենթագումար
                  </Text>

                  <Text>
                    {formatPrice(
                      subtotal
                    )}
                  </Text>
                </View>

                <View
                  style={styles.summaryRow}
                >
                  <Text>
                    Տեղադրման / աշխատանքի գին
                  </Text>

                  <Text>
                    0 ֏
                  </Text>
                </View>

                <View
                  style={styles.summaryRow}
                >
                  <Text>
                    Զեղչ
                  </Text>

                  <Text>
                    0 ֏
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryDivider
                  }
                />

                <View
                  style={
                    styles.summaryTotalRow
                  }
                >
                  <Text
                    style={
                      styles.summaryTotalLabel
                    }
                  >
                    Ընդհանուր
                  </Text>

                  <Text
                    style={
                      styles.summaryTotal
                    }
                  >
                    {formatPrice(
                      subtotal
                    )}
                  </Text>
                </View>
              </View>

              <Pressable
                style={
                  styles.orderButton
                }
                onPress={() =>
                  Alert.alert(
                    'Պատվեր',
                    'Պատվերի ձևակերպումը կավելացնենք հաջորդ փուլում։'
                  )
                }
              >
                <Text
                  style={
                    styles.orderButtonText
                  }
                >
                  Պատվեր ձևակերպել
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.clearButton
                }
                onPress={() =>
                  setCart([])
                }
              >
                <Text
                  style={
                    styles.clearButtonText
                  }
                >
                  Մաքրել զամբյուղը
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function SpecRow({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <View
      style={styles.specRow}
    >
      <Text
        style={styles.specTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.specValue}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },

  updateBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfe3e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  updateTextContainer: {
    flex: 1,
    marginRight: 10,
  },

  updateTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },

  updateSubtitle: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 3,
  },

  updateButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  updateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },

  logoSubtitle: {
    color: '#aeb7c7',
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  cartButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },

  cartButtonText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 15,
  },

  searchContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e3e6eb',
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },

  catalogHeader: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  catalogTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111827',
  },

  catalogSubtitle: {
    color: '#707784',
    marginTop: 3,
    fontSize: 12,
  },

  productCount: {
    backgroundColor: '#111827',
    color: '#ffffff',
    minWidth: 32,
    textAlign: 'center',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
    fontWeight: '800',
  },

  productList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },

  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 14,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  imageContainer: {
    width: 125,
    height: 135,
    backgroundColor: '#f7f8fa',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  productImage: {
    width: '90%',
    height: '90%',
  },

  noImage: {
    fontSize: 38,
  },

  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  productType: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 4,
  },

  productName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: '#111827',
  },

  productModel: {
    fontSize: 11,
    color: '#777f8c',
    marginTop: 4,
  },

  productMegapixel: {
    marginTop: 7,
    fontSize: 11,
    color: '#111827',
    fontWeight: '700',
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  productPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '400',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 70,
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },

  modalHeader: {
    height: 60,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  backButton: {
    color: '#ffffff',
    fontSize: 42,
    lineHeight: 42,
    width: 40,
  },

  modalHeaderTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  detailsContent: {
    padding: 18,
    paddingBottom: 40,
  },

  detailsImageContainer: {
    height: 280,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  detailsImage: {
    width: '90%',
    height: '90%',
  },

  detailsNoImage: {
    fontSize: 70,
  },

  detailsType: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },

  detailsName: {
    color: '#111827',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 5,
  },

  detailsModel: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 5,
  },

  detailsPrice: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 15,
  },

  divider: {
    height: 1,
    backgroundColor: '#dfe3e8',
    marginVertical: 22,
  },

  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },

  specs: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingHorizontal: 15,
  },

  specRow: {
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },

  specTitle: {
    color: '#6b7280',
    fontSize: 13,
  },

  specValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },

  description: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 15,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 21,
  },

  detailsAddButton: {
    marginTop: 25,
    height: 54,
    backgroundColor: '#111827',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },

  cartContent: {
    padding: 16,
    paddingBottom: 40,
  },

  cartItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
  },

  cartImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f5f6f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cartImage: {
    width: '90%',
    height: '90%',
  },

  cartItemInfo: {
    flex: 1,
  },

  cartItemName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },

  cartItemModel: {
    color: '#737b87',
    fontSize: 11,
    marginTop: 3,
  },

  cartItemPrice: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#eef0f3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  quantityValue: {
    width: 35,
    textAlign: 'center',
    fontWeight: '800',
  },

  itemTotal: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },

  removeText: {
    marginTop: 7,
    color: '#777f8c',
    fontSize: 11,
  },

  summary: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    marginTop: 5,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 15,
    color: '#111827',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 6,
  },

  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },

  summaryTotalLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  summaryTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },

  orderButton: {
    height: 54,
    backgroundColor: '#111827',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  orderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },

  clearButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  clearButtonText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
  },

  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyCartIcon: {
    fontSize: 60,
  },

  emptyCartTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
    marginTop: 15,
  },

  emptyCartText: {
    color: '#6b7280',
    marginTop: 7,
    textAlign: 'center',
  },
});