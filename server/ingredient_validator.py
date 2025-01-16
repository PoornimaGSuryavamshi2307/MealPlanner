from transformers import pipeline
import spacy

class IngredientValidator:
    def __init__(self):
        # Load spaCy's English model for entity recognition and parsing
        self.nlp = spacy.load("en_core_web_sm")
        
        # Load zero-shot classification pipeline
        self.classifier = pipeline("zero-shot-classification")
        
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
        
        # Check for food-related entities
        food_entities = [ent for ent in doc.ents if ent.label_ in ["FOOD", "PRODUCT"]]
        if food_entities:
            return True
            
        # Use zero-shot classification to check if text is ingredient-related
        result = self.classifier(
            text,
            candidate_labels=self.ingredient_contexts,
            multi_label=True
        )
        
        # If any ingredient context has high confidence (>0.7), consider it valid
        return any(score > 0.7 for score in result['scores'])
        
    def validate_and_process(self, text):
        """
        Validates if the input is ingredient-related and processes it accordingly
        """
        # First check for measurement patterns
        doc = self.nlp(text.lower())
        has_measurements = any(token.like_num for token in doc)
        
        # Check for cooking verbs or food preparation terms
        cooking_verbs = ["chop", "dice", "slice", "mix", "blend", "add"]
        has_cooking_terms = any(token.lemma_ in cooking_verbs for token in doc)
        
        # Combine with main ingredient classification
        is_ingredient = self.is_ingredient_related(text)
        
        confidence = (
            (1 if has_measurements else 0) +
            (1 if has_cooking_terms else 0) +
            (1 if is_ingredient else 0)
        ) / 3
        
        return {
            'is_valid': confidence > 0.5,
            'confidence': confidence,
            'details': {
                'has_measurements': has_measurements,
                'has_cooking_terms': has_cooking_terms,
                'is_ingredient_related': is_ingredient
            }
        }

# Example usage with Gemini
def process_with_gemini(input_text):
    validator = IngredientValidator()
    validation_result = validator.validate_and_process(input_text)
    
    if not validation_result['is_valid']:
        return {
            'error': 'Input does not appear to be ingredient-related',
            'validation_details': validation_result
        }
        
    # Proceed with Gemini API call if validation passes
    # Your Gemini implementation here