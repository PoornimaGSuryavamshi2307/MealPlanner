from venv import logger
from transformers import pipeline
import spacy

class IngredientValidator:
    def __init__(self):
        # Load spaCy's English model for entity recognition and parsing
        self.nlp = spacy.load("en_core_web_sm")
        
        # Load zero-shot classification pipeline
        # self.classifier = pipeline("zero-shot-classification")
        self.classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                revision="d7645e1"
            )
        
        # Define ingredient-related categories and contexts
        self.ingredient_contexts = [
            "food ingredient",
            "cooking ingredient",
            "recipe component",
            "food item",
            "cooking material"
        ]
        
    def is_ingredient_related(self, text):
        # Parse text with spaCy
        doc = self.nlp(text)
        logger.info("---------is_ingredient_related------------")
        print(doc.ents)
        
        # Check for food-related entities
        food_entities = [ent for ent in doc.ents if ent.label_ in ["FOOD", "PRODUCT"]]
        if food_entities:
            return True
            
        # Use zero-shot classification to check if text is ingredient-related
        try:
            result = self.classifier(
                text,
                candidate_labels=self.ingredient_contexts,
                multi_label=True
            )
        except Exception as e:
            return {
                'is_valid': False,
                'confidence': 0,
                'details': {
                    'error': f"Classifier failed: {e}"
                }
            }

        print("result",result)
        
        # If any ingredient context has high confidence (>0.7), consider it valid
        return any(score > 0.7 for score in result['scores'])
        
    def validate_and_process(self, text):
        """
        Validates if the input is ingredient-related and processes it accordingly
        """
        doc = self.nlp(text.lower())
        
        # Split into potential ingredients
        potential_ingredients = [item.strip() for item in text.split(',')]
        
        # Check for measurements
        has_measurements = any(token.like_num for token in doc)
        
        # Check for cooking verbs
        cooking_verbs = {"chop", "dice", "slice", "mix", "blend", "add"}
        has_cooking_terms = any(token.lemma_ in cooking_verbs for token in doc)
        
        # Check if items are ingredients
        basic_ingredients = {"flour", "sugar", "salt", "oil", "water", "milk", "egg", "rice"}
        has_basic_ingredients = any(ingredient.lower() in basic_ingredients 
                                for ingredient in potential_ingredients)
        
        # Modify confidence calculation
        is_ingredient = self.is_ingredient_related(text)
        
        # New confidence calculation - if it has basic ingredients or is recognized as ingredient-related, that's enough
        # confidence = 1.0 if (has_basic_ingredients or is_ingredient) else 0.0
        confidence = (
            (1 if has_basic_ingredients else 0) +
            (1 if has_cooking_terms else 0) +
            (1 if is_ingredient else 0)
        ) / 3
        return {
            'is_valid': confidence > 0.5,
            'confidence': confidence,
            'details': {
                'has_measurements': has_measurements,
                'has_cooking_terms': has_cooking_terms,
                'is_ingredient_related': is_ingredient,
                'has_basic_ingredients': has_basic_ingredients
            },
            'is_ingredient_related': is_ingredient
        
        }
# Example usage with Gemini
        
    # Proceed with Gemini API call if validation passes
    # Your Gemini implementation here