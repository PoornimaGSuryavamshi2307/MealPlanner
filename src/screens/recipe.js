import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const { height } = Dimensions.get('window');

const SearchScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const moveAnimation = useRef(new Animated.Value(0)).current;
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {

      const access_token = await AsyncStorage.getItem('access_token');
      console.log(access_token);
      const response = await fetch(`${API_BASE_URL}/auth/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${access_token}`
        },
        body: JSON.stringify({
          ingredients: searchText
        })
      })

      // const response = await fetch('https://fakestoreapi.com/products');
      const data = await response.json();
      // console.log(data.recipe);
      // console.log(data.recipe.name);
      // setResults(data);
      handleApiResponse(data);

      // Animate the search container upward
      // Animated.timing(moveAnimation, {
      //   toValue: -height * 0.2,  // Move up by 20% of screen height
      //   duration: 500,
      //   useNativeDriver: true,
      // }).start();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiResponse = (response) => {
    if (Array.isArray(response)) {
      // Map each recipe in the array to the format we need
      const formattedResults = response.map((item, index) => ({
        id: index + 1, // Generate an id for each recipe
        name: item.recipe_name,
        ingredients: item.ingredients,
        // ingredients: item.ingredients.map(ingredient => ({
        //   ingredient: ingredient,
        //   // name: ingredient.name,
        //   // amount: ingredient.amount,
        //   // unit: ingredient.unit
        // })),
        instructions: item.instructions,
      }));

      setResults(formattedResults);
    }
    // If response is a single recipe object
    else if (response.recipe) {
      setResults([{
        id: 1,
        name: response.recipe_name,
        ingredients: response.ingredients,
        instructions: response.instructions,
        // nutrition: response.recipe.nutrition,
        // culturalContext: response.recipe.culturalContext
      }]);
    }
  };

  const renderCard = ({ item }) => {
    console.log('Rendering item:', item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Recipedetails', { recipe: item })}
        activeOpacity={0.8}>
        <Image
          source={require('../../assets/pot.png')}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <Text style={styles.cardTitle}>{item.name}</Text>

      </TouchableOpacity>

    );
  }

  const handleLogoutPress = async () => {
    // Implement your logout logic here
    console.log('Logging out...');
    // Example: Navigate to login screen or clear user data
    try {
      setLoading(true);
      AsyncStorage.removeItem('access_token')
      navigation.navigate('Auth');

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.searchContainer,
          { transform: [{ translateY: moveAnimation }] }
        ]}
      >
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Enter your ingredients..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {results.length > 0 && (
        <Animated.View
          style={[
            styles.resultsContainer,
            { transform: [{ translateY: moveAnimation }] }
          ]}
        >
          <FlatList
            data={results}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
          />
        </Animated.View>
      )}

      <TouchableOpacity
        style={styles.logoutbutton}
        onPress={() => setIsLogoutVisible(!isLogoutVisible)}
        disabled={loading}
      >
        <Icon name="sign-out" size={20} color="white" />
      </TouchableOpacity>

      {/* Logout Confirmation Modal (optional) */}
      {isLogoutVisible && (
        <View style={styles.modal}>
          <Text>Are you sure you want to logout?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleLogoutPress}
            >
              <Text>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsLogoutVisible(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>


  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    padding: 10,
    marginTop: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  cardImage: {
    width: '55%',
    height: 110,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
    alignSelf: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    padding: 10,
    paddingTop: 0,
  },
  logoutButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  logoutbutton: {
    width: 50,
    height: 50,
    position: 'absolute',
    right: 20,
    bottom: 15,
    borderRadius: 20,
    backgroundColor: '#ff4d4d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  // Add this style for the confirmation text
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333333',
  },
});

export default SearchScreen;