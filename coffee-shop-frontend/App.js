import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import axios from 'axios';

// YAHAN APNA IP ADDRESS DALO
const API_BASE_URL = 'http://192.168.10.14:3000';

export default function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [randomItem, setRandomItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'cart', 'orders'

  // Load menu on app start
  useEffect(() => {
    fetchFullMenu();
  }, []);

  // Full menu fetch karne ka function
  const fetchFullMenu = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/menu`);
      setMenuItems(response.data);
      setRandomItem(null);
      setActiveTab('menu');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch menu: ' + error.message);
      console.error(error);
    }
    setLoading(false);
  };

  // Random item fetch karne ka function
  const fetchRandomItem = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/menu/random`);
      setRandomItem(response.data);
      setMenuItems([]);
      setActiveTab('menu');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch random item: ' + error.message);
      console.error(error);
    }
    setLoading(false);
  };

  // Cart mein item add karna
  const addToCart = (item) => {
    if (!item.inStock) {
      Alert.alert('Out of Stock', `${item.name} is currently out of stock`);
      return;
    }

    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    Alert.alert('Added to Cart', `${item.name} added to cart`);
  };

  // Cart se item remove karna
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  // Cart mein quantity update karna
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Cart total calculate karna
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Order place karna
  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before ordering');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      Alert.alert('Order Placed!', `Your order has been placed successfully!\nOrder ID: ${response.data.order.orderId}\nTotal: Rs. ${response.data.order.totalAmount}`);
      setCart([]);
      setShowCart(false);
      fetchOrders();
      setActiveTab('orders');
    } catch (error) {
      Alert.alert('Order Failed', error.response?.data?.error || 'Failed to place order');
    }
    setLoading(false);
  };

  // Orders fetch karna
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(response.data);
      setActiveTab('orders');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>☕ Full-Slash Coffee Shop</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
          <Text style={styles.cartButtonText}>Cart ({cart.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'menu' && styles.activeTab]} 
          onPress={fetchFullMenu}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]} 
          onPress={fetchOrders}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'menu' && (
          <View>
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={fetchFullMenu}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>Full Menu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={fetchRandomItem}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>Surprise Me</Text>
              </TouchableOpacity>
            </View>

            {/* Loading Indicator */}
            {loading && <Text style={styles.loading}>Loading...</Text>}

            {/* Random Item Display */}
            {randomItem && (
              <View>
                <Text style={styles.sectionTitle}>Surprise Item! 🎉</Text>
                <View style={[styles.menuItem, styles.randomItem]}>
                  <Text style={styles.randomItemName}>{randomItem.name}</Text>
                  <Text style={styles.itemCategory}>{randomItem.category}</Text>
                  <Text style={styles.randomItemPrice}>Rs. {randomItem.price}</Text>
                  <Text style={styles.stockStatusGreen}>In Stock ✅</Text>
                  <TouchableOpacity 
                    style={styles.addToCartButton}
                    onPress={() => addToCart(randomItem)}
                  >
                    <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Full Menu Display */}
            {menuItems.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Full Menu ({menuItems.length} items)</Text>
                {menuItems.map((item, index) => (
                  <View key={index} style={styles.menuItem}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                    </View>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    <View style={styles.itemFooter}>
                      <Text style={[
                        styles.stockStatus, 
                        { color: item.inStock ? 'green' : 'red' }
                      ]}>
                        {item.inStock ? 'In Stock ✅' : 'Out of Stock ❌'}
                      </Text>
                      {item.inStock && (
                        <TouchableOpacity 
                          style={styles.addToCartButton}
                          onPress={() => addToCart(item)}
                        >
                          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            <Text style={styles.sectionTitle}>My Orders ({orders.length})</Text>
            {orders.length === 0 ? (
              <Text style={styles.noOrders}>No orders yet</Text>
            ) : (
              orders.map((order, index) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Order #: {order.orderId}</Text>
                    <Text style={[
                      styles.orderStatus,
                      { color: order.status === 'completed' ? 'green' : 'orange' }
                    ]}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                  {order.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.orderItemDetail}>
                      <Text style={styles.orderItemName}>
                        {item.menuItem.name} x {item.quantity}
                      </Text>
                      <Text style={styles.orderItemPrice}>
                        Rs. {item.price * item.quantity}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.orderTotal}>
                    <Text style={styles.totalText}>Total: Rs. {order.totalAmount}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Cart Modal */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Shopping Cart</Text>
            
            {cart.length === 0 ? (
              <Text style={styles.emptyCart}>Your cart is empty</Text>
            ) : (
              <ScrollView style={styles.cartItems}>
                {cart.map((item, index) => (
                  <View key={index} style={styles.cartItem}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>Rs. {item.price} x {item.quantity}</Text>
                      <Text style={styles.cartItemTotal}>Rs. {item.price * item.quantity}</Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item._id, item.quantity - 1)}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item._id, item.quantity + 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeFromCart(item._id)}
                      >
                        <Text style={styles.removeButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {cart.length > 0 && (
              <View style={styles.cartTotal}>
                <Text style={styles.totalAmount}>Total: Rs. {getCartTotal()}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCart(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              
              {cart.length > 0 && (
                <TouchableOpacity 
                  style={styles.orderButton}
                  onPress={placeOrder}
                  disabled={loading}
                >
                  <Text style={styles.orderButtonText}>
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#6F4E37',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  cartButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cartButtonText: {
    color: '#6F4E37',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6F4E37',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#6F4E37',
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6F4E37',
  },
  randomItem: {
    backgroundColor: '#FFF8E1',
    borderLeftColor: '#FFA000',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  randomItemName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFA000',
    textAlign: 'center',
    marginBottom: 5,
  },
  randomItemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 5,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stockStatusGreen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
  },
  addToCartButton: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Cart Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#6F4E37',
  },
  emptyCart: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  cartItems: {
    maxHeight: 300,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#6F4E37',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  removeButton: {
    marginLeft: 10,
  },
  removeButtonText: {
    fontSize: 16,
  },
  cartTotal: {
    borderTopWidth: 2,
    borderTopColor: '#6F4E37',
    paddingTop: 15,
    marginTop: 10,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E7D32',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  orderButton: {
    flex: 2,
    backgroundColor: '#6F4E37',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Orders Styles
  orderItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  orderItemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingLeft: 10,
  },
  orderItemName: {
    fontSize: 14,
    color: '#333',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  orderTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6F4E37',
    textAlign: 'right',
  },
  noOrders: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});
