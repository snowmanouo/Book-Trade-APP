import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, AlertButton} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHideTabBar } from '../../hook/HideTabBar';
import React, { useEffect, useState }from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FormField } from '../../components/FormField';
import { DropdownField } from '../../components/DropdownField';
import { Header } from '../../components/ButtonHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import { asyncGet, asyncPost, uploadImage } from '../../../utils/fetch';
import { LoadingModal } from '../../components/LoadingModal';
import * as ImagePicker from "expo-image-picker";
import { ProfileStackParamList } from '../../navigation/type';
import { api } from '../../../api/api';

export default function SellerScreen() {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [condiction, setcondiction] = useState('');
  const [author, setAutor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishDate, setPublishDate] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ISBN, setISBN] = useState<number>();
  const [price, setPrice] = useState<number>();
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); //提交動畫是否載入

  const route = useRoute<RouteProp<ProfileStackParamList>>();
  const { product } = route.params || {};

  const validateInputs = () => {
    // 書籍名稱檢查
    if (!name) {
      Alert.alert('錯誤', '書籍名稱不能為空');
      return false;
    }
    // 書籍語言檢查
    if (!language) {
      Alert.alert('錯誤', '請選擇書籍語言');
      return false;
    }
    // 書籍類別檢查
    if (!category) {
      Alert.alert('錯誤', '請選擇書籍類別');
      return false;
    }
    // 書籍狀態檢查
    if (!condiction) {
      Alert.alert('錯誤', '請選擇書籍狀態');
      return false;
    }
    //作者檢查
    if (!author) {
      Alert.alert('錯誤', '作者不能為空');
      return false;
    }
    if (!publisher) {
      Alert.alert('錯誤', '出版社不能為空');
      return false;
    }
    // 出版日期檢查
    if (!publishDate) {
      Alert.alert('錯誤', '請選擇出版日期');
      return false;
    }
    // ISBN 檢查
    if (!ISBN) {
      Alert.alert('錯誤', 'ISBN碼不能為空');
      return false;
    }
    if (isNaN(Number(ISBN)) || (ISBN.toString().length !== 10 && ISBN.toString().length !== 13)) {
      Alert.alert('錯誤', 'ISBN碼必須是10或13位整數');
      return false;
    }
    // 價格檢查
    if (!price) {
      Alert.alert('錯誤', '價格不能為空');
      return false;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('錯誤', '價格必須為正整數');
      return false;
    }
    // 商品簡介檢查
    if (!description) {
      Alert.alert('錯誤', '商品簡介不能為空');
      return false;
    }
    if (description.length <= 10) {
      Alert.alert('錯誤', '商品簡介必須大於10字元');
      return false;
    }
    if (!photoUri) {
      Alert.alert('錯誤', '請新增一張照片');
      return false;
    }
    return true;
  };
  // 初始化商品資料
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setLanguage(product.language || '');
      setCategory(product.category || '');
      setcondiction(product.condiction || '');
      setAutor(product.author || '');
      setPublisher(product.publisher || '');
      setPublishDate(product.publishDate || undefined);
      setISBN(product.ISBN);
      setPrice(product.price);
      setDescription(product.description || '');
      //setPhotoUri(product.photouri || null); 現在不能執行 因為假資料利用require取得照片位置 無法與Image-Picker所產生的照片 File:///...相容
    }
  }, [product]);
  const handlePostProduct = async() => {
    if (validateInputs()) {
      setIsLoading(true);
      try {
        const image_url = await uploadImage(name, photoUri as string); //會取得照片url
        const productData = {
          "name": name,
          "language": language,
          "category": category,
          "condiction": condiction,
          "author": author,
          "publisher": publisher,
          "publishDate": publishDate, // 確保日期格式正確，例如 'YYYY-MM-DD'
          "ISBN": ISBN, // 確保 ISBN 為數字且非 undefined
          "price": price, // 確保價格為數字且非 undefined
          "description": description,
          "photouri": image_url,
        };
        const respone = await asyncPost(api.AddProducts, productData);
        setIsLoading(false);
        if (respone) {
          Alert.alert('成功', `商品上架成功${respone}`);
          navigation.goBack();
        }
      } catch (error) {
        setIsLoading(false);
        Alert.alert("錯誤", "商品上架失敗");
      }
    }
  }
  const handleEditProduct = async() => {
    
  }
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); // 關閉日期選擇器
    if (selectedDate) {
      const formattedDate = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(
        selectedDate.getMonth() + 1
      ).padStart(2, '0')}/${selectedDate.getFullYear()}`;
      setPublishDate(formattedDate);
    }
  };
  const handleAddPhoto = async () => {
    const options: AlertButton[] = [
      {
        text: '拍攝照片',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status === 'granted') {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: "images",
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled) {
              setPhotoUri(result.assets[0].uri);
            }
          } else {
            Alert.alert('權限不足', '請允許相機權限以拍攝照片');
          }
        },
      },
      {
        text: '從相簿選取',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status === 'granted') {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: "images",
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled) {
              setPhotoUri(result.assets[0].uri);
            }
          } else {
            Alert.alert('權限不足', '請允許相簿權限以選取照片');
          }
        },
      },
      { text: '取消', style: 'cancel' },
    ];
    Alert.alert('新增照片', '請選擇照片來源', options);
  };


  const navigation = useNavigation();
  useHideTabBar();
  return (
    <>
      <SafeAreaView style={styles.container}>
        {product
          ? 
          <Header title="修改商品" text="修改" navigation={navigation} Change={handleEditProduct}/>
          :
          <Header title="發佈新商品" text="發佈" navigation={navigation} Change={handlePostProduct}/>
        }
        <ScrollView>
          {/* Product Form */}
          <View style={styles.form}>
            <FormField label="書籍名稱：" placeholder="請輸入書籍名稱" value={ name } onChangeText={ setName }/>
            <DropdownField
              label="書籍語言："
              selectedValue={language}
              onValueChange={(value) => setLanguage(value)}
              items={['中文', '英文']}
            />
            <DropdownField
              label="書籍類別："
              selectedValue={category}
              onValueChange={(value) => setCategory(value)}
              items={[
                '文學', '藝術', '哲學宗教', '人文史地', '自然科普',
                '社會科學', '商業理財', '語言學習', '醫療保健',
                '旅遊休閒', '電腦資訊', '考試用書', '動畫/遊戲',
              ]}
            />
            <DropdownField
              label="書籍狀態："
              selectedValue={condiction}
              onValueChange={(value) => setcondiction(value)}
              items={['全新', '二手']}
            />
            <FormField label="作者：" placeholder="請輸入作者名稱" value={ author } onChangeText={ setAutor }/>
            <FormField label="出版社：" placeholder="請輸入出版社名稱" value={ publisher } onChangeText={ setPublisher }/>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <FormField
                label="出版日期："
                value={publishDate}
                editable= {false}
              />
              {showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display='spinner'
                  onChange={handleDateChange}
                />
              )}
            </TouchableOpacity>
          
            <FormField label="ISBN碼：" placeholder="請輸入ISBN碼" keyboardType="numeric" value={ ISBN?.toString() } onChangeText={(text) => {
              const numericValue = Number(text); // 將文字轉換為數字
              setISBN(isNaN(numericValue) ? undefined : numericValue); // 處理無效輸入
            }}/>
            <FormField label="價格：" placeholder="請輸入價格" keyboardType="numeric" value={ price?.toString() } onChangeText={(text) => {
              const numericValue = Number(text); // 將文字轉換為數字
              setPrice(isNaN(numericValue) ? undefined : numericValue); // 處理無效輸入
            }}/>
            <FormField label="商品簡介：" placeholder="請輸入商品簡介" value= {description} onChangeText={ setDescription }/>
          </View>
          {/* Image */}
          <TouchableOpacity style={styles.imageButtonContainer} onPress={handleAddPhoto}>
            <Ionicons name="images-outline" size={24} color={"#007bff"} />
            <Text style={styles.imageText}>{photoUri ? "變更照片" : "新增照片"}</Text>
          </TouchableOpacity>
          {photoUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: photoUri }} style={styles.image} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <LoadingModal 
          isLoading={isLoading} 
          message="正在上傳商品..." 
      />
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 15,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    width: 100,
    fontSize: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdown: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
  },
  imageButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageText: {
    marginLeft: 6,
    color: '#007bff',
  },
  imageContainer: {
    alignItems: 'center', 
    marginVertical: 10,
  },
  image: {
    borderRadius: 10,
    marginBottom: 50,
    width: 350,
    height: 350,
  }
});