import { ScrollView, StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'


const recipeData = {
  name: "Classic Spaghetti Carbonara",
  url: "https://picsum.photos/seed/picsum/200/300",
  ingredients: [
    "400g spaghetti",
    "200g guanciale or pancetta, diced",
    "4 large eggs",
    "100g Pecorino Romano, grated",
    "100g Parmigiano Reggiano, grated",
    "2 cloves garlic, minced",
    "Black pepper to taste",
    "Salt for pasta water"
  ],
  instructions: "Begin by bringing a large pot of salted water to boil. While waiting, dice the guanciale and grate both kinds of cheese. In a mixing bowl, whisk together the eggs and grated cheese, seasoning with plenty of black pepper. Cook the pasta according to package instructions until al dente. Meanwhile, in a large pan, cook the guanciale until crispy and the fat has rendered. When the pasta is ready, reserve a cup of pasta water before draining. Working quickly, add the hot pasta to the pan with the guanciale, remove from heat, and stir in the egg and cheese mixture, tossing rapidly to create a creamy sauce. Add pasta water as needed to achieve desired consistency. Serve immediately with extra grated cheese and black pepper."
};

// You can then use it in your component like this:
// const Recipedetails = () => {
const Recipedetails = ({ route }) => {
  const { recipe } = route.params;
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>{recipe.name}</Text>
        <Image style={styles.placeholder} source={require('D:/Self-Learnt/React/MealPlanner/assets/cooking.png')} />;
        {/* <Image
          source={require('../assets/recipe-image.jpg')}
          style={styles.cardImage}
          resizeMode="cover"
        /> */}
        <Text style={styles.sectionTitle}>Ingredients:</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
        ))}

        <Text style={styles.sectionTitle}>Instructions:</Text>
        <Text style={styles.instructions}>{recipe.instructions}</Text>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 4,
    paddingLeft: 8,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
  },
  cardImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  placeholder: {
    width: 120,
    height: 110,
    marginBottom: 16,
    alignSelf: 'center',
  },
});

// const Recipedetails = ({route}) => {
//   const {recipe} = route.params;
//   return (
//     <View>
//       <h1>{recipe.name}</h1>
//       <Image
//         style={styles.tinyLogo}
//         source={{
//           uri: 'https://reactnative.dev/img/tiny_logo.png',
//         }}
//       /> 
//       <p>{recipe.instructions}</p>
//       <p>{recipe.nutrition}</p>
//     </View>
//   )
// }

export default Recipedetails
