#!/bin/bash

# Kalan form component'leri için hızlı güncelleme scripti

cd /Users/mehmettfaik/Documents/GitHub/Tuana-Dokuman-Frontend

# Component listesi
components=(
    "OrderConfirmationForm"
    "SiparisForm" 
    "PriceOfferForm"
)

for component in "${components[@]}"; do
    echo "Updating $component.jsx..."
    
    # 1. Import değiştir
    sed -i '' "s/import { generatePDF } from '..\/api';/import usePDFGeneration from '..\/hooks\/usePDFGeneration';/" "src/components/${component}.jsx"
    
    # 2. State'leri güncelle (sadece loading'i kaldır)
    sed -i '' 's/const \[loading, setLoading\] = useState(false);//' "src/components/${component}.jsx"
    
    # 3. disabled={loading} to disabled={isGenerating}
    sed -i '' 's/disabled={loading}/disabled={isGenerating}/g' "src/components/${component}.jsx"
    
    # 4. setLoading calls'ları kaldır
    sed -i '' 's/setLoading(true);//' "src/components/${component}.jsx"
    sed -i '' 's/setLoading(false);//' "src/components/${component}.jsx"
    
    echo "$component.jsx updated!"
done

echo "All components updated! Manual fixes still needed for handleSubmit functions."
