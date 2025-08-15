#!/bin/bash

# Kalan button ve message güncellemeleri için script

cd /Users/mehmettfaik/Documents/GitHub/Tuana-Dokuman-Frontend

# Component listesi
components=(
    "OrderConfirmationForm"
    "SiparisForm" 
    "PriceOfferForm"
)

for component in "${components[@]}"; do
    echo "Updating messages and buttons for $component.jsx..."
    
    # Loading state button fixes
    sed -i '' 's/{loading ? <span className="spinner"><\/span> : null}/{isGenerating ? (<><span className="spinner"><\/span>PDF Oluşturuluyor...</>) : ("PDF Oluştur ve İndir")}/g' "src/components/${component}.jsx"
    sed -i '' 's/{loading ? '\''PDF Oluşturuluyor\.\.\.'\'' : '\''PDF Oluştur ve İndir'\''}//' "src/components/${component}.jsx"
    
    echo "$component.jsx buttons updated!"
done

echo "Button updates completed!"
