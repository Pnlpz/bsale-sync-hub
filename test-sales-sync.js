/**
 * Test script for Sales Sync functionality
 * This script tests the Bsale API integration for syncing sales/documents
 */

import { BsaleClient } from './src/lib/bsale-client.js';

// Initialize Bsale client with the API token
const bsaleClient = new BsaleClient('e908155dfbb8f3c408a014ef6a9ad0e639609ced');

async function testSalesSync() {
  console.log('🔄 Testing Bsale Sales Sync...\n');

  try {
    // Test 1: Get documents (sales)
    console.log('📄 Fetching documents from Bsale...');
    const documentsResponse = await bsaleClient.getDocuments(10, 0);
    
    console.log(`✅ Found ${documentsResponse.items.length} documents`);
    console.log(`📊 Total count: ${documentsResponse.count}`);
    
    if (documentsResponse.items.length > 0) {
      const firstDocument = documentsResponse.items[0];
      console.log('\n📋 First document details:');
      console.log(`   ID: ${firstDocument.id}`);
      console.log(`   Number: ${firstDocument.number}`);
      console.log(`   Total Amount: ${firstDocument.totalAmount}`);
      console.log(`   Net Amount: ${firstDocument.netAmount}`);
      console.log(`   State: ${firstDocument.state}`);
      console.log(`   Emission Date: ${new Date(firstDocument.emissionDate * 1000).toISOString()}`);
      
      // Test 2: Get document details
      console.log(`\n🔍 Fetching details for document ${firstDocument.id}...`);
      try {
        const detailsResponse = await bsaleClient.getDocumentDetails(firstDocument.id);
        console.log(`✅ Found ${detailsResponse.items.length} detail items`);
        
        if (detailsResponse.items.length > 0) {
          const firstDetail = detailsResponse.items[0];
          console.log('\n📦 First detail item:');
          console.log(`   ID: ${firstDetail.id}`);
          console.log(`   Quantity: ${firstDetail.quantity}`);
          console.log(`   Net Unit Value: ${firstDetail.netUnitValue}`);
          console.log(`   Total Unit Value: ${firstDetail.totalUnitValue}`);
          
          if (firstDetail.variant) {
            console.log(`   Variant ID: ${firstDetail.variant.id}`);
            console.log(`   Variant Description: ${firstDetail.variant.description}`);
            if (firstDetail.variant.product) {
              console.log(`   Product ID: ${firstDetail.variant.product.id}`);
              console.log(`   Product Name: ${firstDetail.variant.product.name}`);
            }
          }
        }
      } catch (detailError) {
        console.log(`❌ Error fetching document details: ${detailError.message}`);
      }
    }

    // Test 3: Get products for reference
    console.log('\n🛍️ Fetching products from Bsale...');
    const productsResponse = await bsaleClient.getProducts(5, 0);
    console.log(`✅ Found ${productsResponse.items.length} products`);
    
    if (productsResponse.items.length > 0) {
      console.log('\n📦 Available products:');
      productsResponse.items.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
      });
    }

    console.log('\n✅ Sales sync test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during sales sync test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSalesSync();
