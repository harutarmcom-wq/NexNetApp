import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
} from "react-native";

type Product = {
  id: number;
  name: string;
  model?: string | null;
  brand?: string | null;
  category?: string | null;
  type?: string | null;
  megapixel?: string | null;
  channels?: string | null;
  ports?: string | null;
  capacity?: string | null;
  description?: string | null;
  price: number;
  stock?: number;
  image_url?: string | null;
};

type CartItem = Product & {
  quantity: number;
};

const API_URL = "https://pure-fine-exceptions-voices.trycloudflare.com";

const CURRENT_VERSION =
  Constants.expoConfig?.version || "1.0.1";

const UPDATE_URL =
  "https://raw.githubusercontent.com/harutarmcom-wq/NexNetApp/main/update.json";

function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  const normalized = imageUrl.replaceAll("\\", "/");

  return `${API_URL}/${normalized.replace(/^\/+/, "")}`;
}

function isNewerVersion(
  latestVersion: string,
  currentVersion: string
) {
  const latest = latestVersion
    .split(".")
    .map(Number);

  const current = currentVersion
    .split(".")
    .map(Number);

  for (let i = 0; i < 3; i++) {
    const latestPart = latest[i] || 0;
    const currentPart = current[i] || 0;

    if (latestPart > currentPart) {
      return true;
    }

    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [showCart, setShowCart] = useState(false);

  const [latestVersion, setLatestVersion] =
    useState<string | null>(null);

  const [latestApkUrl, setLatestApkUrl] =
    useState<string | null>(null);

  const [downloadingUpdate, setDownloadingUpdate] =
    useState(false);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setProductsError("");

      const response = await fetch(
        `${API_URL}/products/`
      );

      if (!response.ok) {
        throw new Error("Products request failed");
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error(error);

      setProductsError(
        "Ապրանքները բեռնել չհաջողվեց։ Ստուգիր ինտերնետ կապը։"
      );
    } finally {
      setLoadingProducts(false);
    }
  }

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
        setLatestApkUrl(data.apkUrl);
      }
    } catch (error) {
      console.log(
        "Update check failed:",
        error
      );
    }
  }

  async function downloadAndInstallUpdate() {
    if (!latestApkUrl || downloadingUpdate) {
      return;
    }

    try {
      setDownloadingUpdate(true);

      const filename =
        `NEXNET-${latestVersion || "update"}.apk`;

      const destination =
        `${FileSystem.cacheDirectory}${filename}`;

      const downloadResult =
        await FileSystem.downloadAsync(
          latestApkUrl,
          destination
        );

      if (
        !downloadResult.uri
      ) {
        throw new Error(
          "APK download failed"
        );
      }

      const contentUri =
        await FileSystem.getContentUriAsync(
          downloadResult.uri
        );

      await Linking.openURL(contentUri);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Թարմացման սխալ",
        "APK-ն ներբեռնել կամ տեղադրել չհաջողվեց։"
      );
    } finally {
      setDownloadingUpdate(false);
    }
  }

  useEffect(() => {
    loadProducts();
    checkForUpdate();
  }, []);

  const filteredProducts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) => {
          const text = [
            product.name,
            product.model,
            product.brand,
            product.category,
            product.type,
            product.megapixel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(query);
        }
      );
    },
    [products, search]);

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        item.quantity,
    0
  );

  const installationPrice = 0;
  const discount = 0;

  const finalTotal =
    subtotal +
    installationPrice -
    discount;

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existing =
        currentCart.find(
          (item) =>
            item.id === product.id
        );

      if (existing) {
        return currentCart.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
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

    setSelectedProduct(null);
  }

  function increaseQuantity(
    productId: number
  ) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(
    productId: number
  ) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }

  function removeFromCart(
    productId: number
  ) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== productId
      )
    );
  }

  function formatPrice(price: number) {
    return `${Number(price || 0).toLocaleString(
      "en-US"
    )} ֏`;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              NEXNET
            </Text>

            <Text style={styles.logoSub}>
              SECURITY
            </Text>
          </View>

          <Pressable
            style={styles.cartButton}
            onPress={() =>
              setShowCart(true)
            }
          >
            <Text style={styles.cartButtonText}>
              🛒 Զամբյուղ ({cartCount})
            </Text>
          </Pressable>
        </View>

        {latestVersion && (
          <View style={styles.updateBanner}>
            <View style={styles.updateTextBox}>
              <Text style={styles.updateTitle}>
                🔔 Նոր տարբերակ կա
              </Text>

              <Text style={styles.updateVersion}>
                NEXNET {latestVersion}
              </Text>
            </View>

            <Pressable
              style={styles.updateButton}
              onPress={
                downloadAndInstallUpdate
              }
              disabled={
                downloadingUpdate
              }
            >
              {downloadingUpdate ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={
                    styles.updateButtonText
                  }
                >
                  Թարմացնել
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.searchContainer}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Փնտրել ապրանք..."
            placeholderTextColor="#8b8f98"
            style={styles.searchInput}
          />
        </View>

        {loadingProducts ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#208AEF"
            />

            <Text style={styles.loadingText}>
              Ապրանքները բեռնվում են...
            </Text>
          </View>
        ) : productsError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>
              {productsError}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadProducts}
            >
              <Text style={styles.retryText}>
                Կրկին փորձել
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.productsContainer
            }
          >
            {filteredProducts.length ===
            0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  Ապրանք չի գտնվել։
                </Text>
              </View>
            ) : (
              filteredProducts.map(
                (product) => {
                  const image =
                    getImageUrl(
                      product.image_url
                    );

                  return (
                    <Pressable
                      key={product.id}
                      style={
                        styles.productCard
                      }
                      onPress={() =>
                        setSelectedProduct(
                          product
                        )
                      }
                    >
                      <View
                        style={
                          styles.productImageBox
                        }
                      >
                        {image ? (
                          <Image
                            source={{
                              uri: image,
                            }}
                            style={
                              styles.productImage
                            }
                            resizeMode="contain"
                          />
                        ) : (
                          <View
                            style={
                              styles.noImage
                            }
                          >
                            <Text
                              style={
                                styles.noImageText
                              }
                            >
                              NEXNET
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={
                          styles.productType
                        }
                      >
                        {product.type ||
                          product.category ||
                          "Ապրանք"}
                      </Text>

                      <Text
                        style={
                          styles.productName
                        }
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>

                      {product.model && (
                        <Text
                          style={
                            styles.productModel
                          }
                          numberOfLines={1}
                        >
                          {product.model}
                        </Text>
                      )}

                      {product.megapixel && (
                        <Text
                          style={
                            styles.productSpec
                          }
                        >
                          {product.megapixel}
                        </Text>
                      )}

                      <Text
                        style={
                          styles.productPrice
                        }
                      >
                        {formatPrice(
                          product.price
                        )}
                      </Text>

                      <Pressable
                        style={
                          styles.addButton
                        }
                        onPress={() =>
                          addToCart(product)
                        }
                      >
                        <Text
                          style={
                            styles.addButtonText
                          }
                        >
                          Ավելացնել զամբյուղ
                        </Text>
                      </Pressable>
                    </Pressable>
                  );
                }
              )
            )}
          </ScrollView>
        )}

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
              style={styles.modalSafe}
            >
              <ScrollView
                contentContainerStyle={
                  styles.detailsContainer
                }
              >
                <Pressable
                  style={
                    styles.backButton
                  }
                  onPress={() =>
                    setSelectedProduct(
                      null
                    )
                  }
                >
                  <Text
                    style={
                      styles.backButtonText
                    }
                  >
                    ← Վերադառնալ
                  </Text>
                </Pressable>

                <View
                  style={
                    styles.detailsImageBox
                  }
                >
                  {getImageUrl(
                    selectedProduct.image_url
                  ) ? (
                    <Image
                      source={{
                        uri:
                          getImageUrl(
                            selectedProduct.image_url
                          ) || "",
                      }}
                      style={
                        styles.detailsImage
                      }
                      resizeMode="contain"
                    />
                  ) : (
                    <Text
                      style={
                        styles.noImageText
                      }
                    >
                      NEXNET
                    </Text>
                  )}
                </View>

                <Text
                  style={
                    styles.detailsType
                  }
                >
                  {selectedProduct.type ||
                    selectedProduct.category ||
                    "Ապրանք"}
                </Text>

                <Text
                  style={
                    styles.detailsTitle
                  }
                >
                  {selectedProduct.name}
                </Text>

                {selectedProduct.model && (
                  <Text
                    style={
                      styles.detailsModel
                    }
                  >
                    {selectedProduct.model}
                  </Text>
                )}

                <Text
                  style={
                    styles.detailsPrice
                  }
                >
                  {formatPrice(
                    selectedProduct.price
                  )}
                </Text>

                <View
                  style={
                    styles.divider
                  }
                />

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Տեխնիկական տվյալներ
                </Text>

                <View
                  style={
                    styles.specList
                  }
                >
                  {selectedProduct.brand && (
                    <SpecRow
                      label="Բրենդ"
                      value={
                        selectedProduct.brand
                      }
                    />
                  )}

                  {selectedProduct.model && (
                    <SpecRow
                      label="Մոդել"
                      value={
                        selectedProduct.model
                      }
                    />
                  )}

                  {selectedProduct.type && (
                    <SpecRow
                      label="Տեսակ"
                      value={
                        selectedProduct.type
                      }
                    />
                  )}

                  {selectedProduct.megapixel && (
                    <SpecRow
                      label="Megapixel"
                      value={
                        selectedProduct.megapixel
                      }
                    />
                  )}

                  {selectedProduct.channels && (
                    <SpecRow
                      label="Channels"
                      value={
                        selectedProduct.channels
                      }
                    />
                  )}

                  {selectedProduct.ports && (
                    <SpecRow
                      label="Ports"
                      value={
                        selectedProduct.ports
                      }
                    />
                  )}

                  {selectedProduct.capacity && (
                    <SpecRow
                      label="Capacity"
                      value={
                        selectedProduct.capacity
                      }
                    />
                  )}

                  {selectedProduct.category && (
                    <SpecRow
                      label="Կատեգորիա"
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
                    styles.detailsCartButton
                  }
                  onPress={() =>
                    addToCart(
                      selectedProduct
                    )
                  }
                >
                  <Text
                    style={
                      styles.detailsCartButtonText
                    }
                  >
                    Ավելացնել զամբյուղ
                  </Text>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          )}
        </Modal>

        <Modal
          visible={showCart}
          animationType="slide"
          onRequestClose={() =>
            setShowCart(false)
          }
        >
          <SafeAreaView
            style={styles.modalSafe}
          >
            <View style={styles.cartHeader}>
              <Pressable
                onPress={() =>
                  setShowCart(false)
                }
              >
                <Text
                  style={
                    styles.backButtonText
                  }
                >
                  ← Կատալոգ
                </Text>
              </Pressable>

              <Text
                style={
                  styles.cartTitle
                }
              >
                Զամբյուղ
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={
                styles.cartContainer
              }
            >
              {cart.length === 0 ? (
                <View
                  style={
                    styles.emptyCart
                  }
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
                      styles.emptyCartText
                    }
                  >
                    Զամբյուղը դատարկ է
                  </Text>
                </View>
              ) : (
                <>
                  {cart.map((item) => {
                    const image =
                      getImageUrl(
                        item.image_url
                      );

                    return (
                      <View
                        key={item.id}
                        style={
                          styles.cartItem
                        }
                      >
                        {image ? (
                          <Image
                            source={{
                              uri: image,
                            }}
                            style={
                              styles.cartImage
                            }
                            resizeMode="contain"
                          />
                        ) : (
                          <View
                            style={
                              styles.cartNoImage
                            }
                          >
                            <Text>
                              N
                            </Text>
                          </View>
                        )}

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

                          {item.model && (
                            <Text
                              style={
                                styles.cartItemModel
                              }
                            >
                              {item.model}
                            </Text>
                          )}

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
                                  styles.quantityButtonText
                                }
                              >
                                −
                              </Text>
                            </Pressable>

                            <Text
                              style={
                                styles.quantityText
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
                                  styles.quantityButtonText
                                }
                              >
                                +
                              </Text>
                            </Pressable>
                          </View>
                        </View>

                        <View
                          style={
                            styles.cartItemRight
                          }
                        >
                          <Text
                            style={
                              styles.itemTotal
                            }
                          >
                            {formatPrice(
                              Number(
                                item.price || 0
                              ) *
                                item.quantity
                            )}
                          </Text>

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
                    );
                  })}

                  <View
                    style={
                      styles.summary
                    }
                  >
                    <SummaryRow
                      label="Ենթագումար"
                      value={formatPrice(
                        subtotal
                      )}
                    />

                    <SummaryRow
                      label="Տեղադրման աշխատանք"
                      value={formatPrice(
                        installationPrice
                      )}
                    />

                    <SummaryRow
                      label="Զեղչ"
                      value={formatPrice(
                        discount
                      )}
                    />

                    <View
                      style={
                        styles.summaryDivider
                      }
                    />

                    <View
                      style={
                        styles.totalRow
                      }
                    >
                      <Text
                        style={
                          styles.totalLabel
                        }
                      >
                        Ընդհանուր
                      </Text>

                      <Text
                        style={
                          styles.totalValue
                        }
                      >
                        {formatPrice(
                          finalTotal
                        )}
                      </Text>
                    </View>

                    <Pressable
                      style={
                        styles.orderButton
                      }
                      onPress={() =>
                        Alert.alert(
                          "Պատվեր",
                          "Պատվերի ձևակերպումը հաջորդ քայլով կավելացնենք։"
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
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function SpecRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>
        {label}
      </Text>

      <Text style={styles.specValue}>
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  container: {
    flex: 1,
  },

  header: {
    minHeight: 78,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#101828",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 2,
  },

  logoSub: {
    color: "#98a2b3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: -2,
  },

  cartButton: {
    backgroundColor: "#208AEF",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },

  cartButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },

  updateBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#e8f3ff",
    borderWidth: 1,
    borderColor: "#b7dcff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  updateTextBox: {
    flex: 1,
    marginRight: 10,
  },

  updateTitle: {
    color: "#155eef",
    fontSize: 15,
    fontWeight: "800",
  },

  updateVersion: {
    color: "#475467",
    marginTop: 2,
    fontSize: 12,
  },

  updateButton: {
    backgroundColor: "#208AEF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
  },

  updateButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  searchContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },

  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    color: "#101828",
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },

  productsContainer: {
    padding: 14,
    paddingBottom: 30,
  },

  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    marginBottom: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: "#eaecf0",
  },

  productImageBox: {
    height: 190,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  noImage: {
    alignItems: "center",
    justifyContent: "center",
  },

  noImageText: {
    color: "#98a2b3",
    fontWeight: "900",
    letterSpacing: 2,
  },

  productType: {
    marginTop: 12,
    color: "#208AEF",
    fontSize: 12,
    fontWeight: "800",
  },

  productName: {
    marginTop: 4,
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
  },

  productModel: {
    marginTop: 5,
    color: "#667085",
    fontSize: 13,
  },

  productSpec: {
    marginTop: 6,
    color: "#475467",
    fontSize: 12,
  },

  productPrice: {
    marginTop: 10,
    color: "#101828",
    fontSize: 19,
    fontWeight: "900",
  },

  addButton: {
    marginTop: 12,
    backgroundColor: "#208AEF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    color: "#667085",
  },

  errorText: {
    color: "#b42318",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: "#208AEF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  emptyText: {
    color: "#667085",
    fontSize: 16,
  },

  modalSafe: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  detailsContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 14,
  },

  backButtonText: {
    color: "#208AEF",
    fontSize: 15,
    fontWeight: "800",
  },

  detailsImageBox: {
    height: 270,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  detailsImage: {
    width: "100%",
    height: "100%",
  },

  detailsType: {
    marginTop: 18,
    color: "#208AEF",
    fontSize: 13,
    fontWeight: "800",
  },

  detailsTitle: {
    marginTop: 5,
    color: "#101828",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 31,
  },

  detailsModel: {
    marginTop: 6,
    color: "#667085",
    fontSize: 14,
  },

  detailsPrice: {
    marginTop: 12,
    color: "#101828",
    fontSize: 24,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: "#e4e7ec",
    marginVertical: 20,
  },

  sectionTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },

  specList: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
  },

  specRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f4f7",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },

  specLabel: {
    color: "#667085",
    fontSize: 13,
    flex: 1,
  },

  specValue: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },

  description: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    color: "#475467",
    fontSize: 14,
    lineHeight: 22,
  },

  detailsCartButton: {
    marginTop: 20,
    backgroundColor: "#208AEF",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  detailsCartButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  cartHeader: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e7ec",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  cartTitle: {
    color: "#101828",
    fontSize: 21,
    fontWeight: "900",
  },

  cartContainer: {
    padding: 14,
    paddingBottom: 40,
  },

  emptyCart: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyCartIcon: {
    fontSize: 50,
  },

  emptyCartText: {
    marginTop: 15,
    color: "#667085",
    fontSize: 17,
    fontWeight: "700",
  },

  cartItem: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 11,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eaecf0",
  },

  cartImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },

  cartNoImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: "#f2f4f7",
    alignItems: "center",
    justifyContent: "center",
  },

  cartItemInfo: {
    flex: 1,
    marginHorizontal: 10,
  },

  cartItemName: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "800",
  },

  cartItemModel: {
    color: "#667085",
    fontSize: 11,
    marginTop: 3,
  },

  cartItemPrice: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityButtonText: {
    color: "#155eef",
    fontSize: 20,
    fontWeight: "800",
  },

  quantityText: {
    width: 35,
    textAlign: "center",
    color: "#101828",
    fontWeight: "800",
  },

  cartItemRight: {
    alignItems: "flex-end",
  },

  itemTotal: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "900",
  },

  removeText: {
    color: "#d92d20",
    fontSize: 11,
    marginTop: 10,
    fontWeight: "700",
  },

  summary: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eaecf0",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summaryLabel: {
    color: "#667085",
    fontSize: 13,
  },

  summaryValue: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "700",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#e4e7ec",
    marginVertical: 8,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "900",
  },

  totalValue: {
    color: "#101828",
    fontSize: 21,
    fontWeight: "900",
  },

  orderButton: {
    marginTop: 18,
    backgroundColor: "#208AEF",
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
  },

  orderButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  clearButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  clearButtonText: {
    color: "#d92d20",
    fontWeight: "800",
  },
});