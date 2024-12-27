import React from 'react';
import { use, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Replace with your preferred icon library
import authAPI from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Recipe = () => {
  const [inputValue, setInputValue] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const handleSubmit = () => {
    // Axios.get('').then((response) => {
    //   setRecipes(response.data);
    // }).catch((error) => {
    //   console.error(error);
    // });
  };
  useEffect(() => {
    handleSubmit();
  }, []);

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Ask your Recipe</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter your ingredients"
            value={inputValue}
            onChangeText={setInputValue}
            placeholderTextColor="#888"
          />
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>

          {recipes.map((recipe, index) => (
            <View key={index}>
              <Text>{recipe.title}</Text>
              <Text>{recipe.ingredients}</Text>
            </View>
          ))}

        </View>
        {/* Floating Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  modal: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
});

export default Recipe;