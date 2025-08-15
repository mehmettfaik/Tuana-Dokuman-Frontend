#!/bin/bash

# SystemStatus komponentini tüm form dosyalarına ekle

FORMS=(
  "ProformaInvoiceForm.jsx"
  "PackingListForm.jsx" 
  "FabricTechnicalForm.jsx"
  "CreditNoteForm.jsx"
  "DebitNoteForm.jsx"
  "OrderConfirmationForm.jsx"
  "SiparisForm.jsx"
  "PriceOfferForm.jsx"
)

for form in "${FORMS[@]}"; do
  echo "Adding SystemStatus to $form..."
  
  # Import ekle
  sed -i '' "s|import '../css/|import SystemStatus from './SystemStatus';\nimport '../css/|g" "src/components/$form"
  
  # SystemStatus komponentini header'dan sonra ekle (div className=".*-form-header" kapanışından sonra)
  sed -i '' 's|</div>$|</div>\n\n      {/* Sistem Durumu */}\n      <SystemStatus />|g' "src/components/$form"
  
  echo "✅ $form updated"
done

echo "🎉 Tüm formlara SystemStatus eklendi!"
