'use client'
import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, IconButton, InputAdornment, Pagination, Card, CardContent, CardMedia } from '@mui/material'
import { Add, Remove, Search, ArrowForward, ArrowBack } from '@mui/icons-material'
import { firestore } from './firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
}

const API_KEY = 'a3b181614d9e422f81e9062fba23c030';
const RECIPE_API_URL = 'https://api.spoonacular.com/recipes/findByIngredients';

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInventory, setFilteredInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [recipes, setRecipes] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [recipesPerPage] = useState(5)
  const [showRecipes, setShowRecipes] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const addItem = async (item, quantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity: existingQuantity } = docSnap.data()
      await setDoc(docRef, { quantity: existingQuantity + parseInt(quantity) })
    } else {
      await setDoc(docRef, { quantity: parseInt(quantity) })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    await deleteDoc(docRef)
    await updateInventory()
  }

  const increaseQuantity = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
      await updateInventory()
    }
  }

  const decreaseQuantity = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity > 1) {
        await setDoc(docRef, { quantity: quantity - 1 })
        await updateInventory()
      }
    }
  }

  const updateItemQuantity = async (item, quantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    await setDoc(docRef, { quantity: parseInt(quantity) })
    await updateInventory()
  }

  const updateInventory = async () => {
    const q = query(collection(firestore, 'inventory'))
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map(doc => ({ name: doc.id, ...doc.data() }))
    setInventory(items)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    if (e.target.value === '') {
      setFilteredInventory(inventory)
    } else {
      const filtered = inventory.filter(item =>
        item.name.toLowerCase().includes(e.target.value.toLowerCase())
      )
      setFilteredInventory(filtered)
    }
  }

  const fetchRecipes = async () => {
    const ingredientString = filteredInventory.map(item => item.name).join(',')
    const response = await fetch(`${RECIPE_API_URL}?apiKey=${API_KEY}&ingredients=${ingredientString}`);
    const data = await response.json();
    setRecipes(data);
  }

  const handleRecipeSearch = () => {
    fetchRecipes();
    setShowRecipes(true);
  }

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  }

  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = recipes.slice(indexOfFirstRecipe, indexOfLastRecipe);

  useEffect(() => {
    updateInventory()
  }, [])

  useEffect(() => {
    setFilteredInventory(inventory)
  }, [inventory])

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 3,
      }}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 2 }}>
            Add Item
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <TextField
              label="Quantity"
              variant="outlined"
              fullWidth
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName, itemQuantity)
                setItemName('')
                setItemQuantity('')
                handleClose()
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Stack spacing={2} width="100%" maxWidth="900px">
        {!showRecipes ? (
          <>
            <Button variant="contained" onClick={handleOpen} sx={{ alignSelf: 'flex-start' }}>
              Add New Item
            </Button>
            <TextField
              label="Search Items"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearch}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Box borderRadius={2} overflow="hidden" boxShadow={2}>
              <Box
                bgcolor={'#1976d2'}
                display={'flex'}
                justifyContent={'center'}
                alignItems={'center'}
                padding={2}
              >
                <Typography variant={'h4'} color={'white'} textAlign={'center'}>
                  Inventory Items
                </Typography>
              </Box>
              <Stack spacing={2} padding={2} bgcolor="white" borderRadius={2}>
                {filteredInventory.map(({ name, quantity }) => (
                  <Box
                    key={name}
                    display={'flex'}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                    padding={2}
                    border={'1px solid #ddd'}
                    borderRadius={1}
                    boxShadow={1}
                  >
                    <Typography variant={'h5'} color={'#333'} sx={{ flexGrow: 1, textAlign: 'center' }}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                    <Stack
                      direction={'row'}
                      alignItems={'center'}
                      spacing={1}
                      sx={{ flexGrow: 1, justifyContent: 'center' }}
                    >
                      <IconButton onClick={() => decreaseQuantity(name)} color="primary" size="large">
                        <Remove fontSize="inherit" />
                      </IconButton>
                      <TextField
                        type="number"
                        variant="outlined"
                        value={quantity}
                        onChange={(e) => updateItemQuantity(name, e.target.value)}
                        sx={{
                          width: '80px',
                          fontSize: '1.5rem',
                          textAlign: 'center',
                        }}
                        inputProps={{
                          style: { textAlign: 'center', fontSize: '1.25rem' },
                        }}
                      />
                      <IconButton onClick={() => increaseQuantity(name)} color="primary" size="large">
                        <Add fontSize="inherit" />
                      </IconButton>
                    </Stack>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => removeItem(name)}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
            <Button
              variant="outlined"
              onClick={handleRecipeSearch}
              sx={{ marginTop: 2 }}
            >
              Get Recipe Suggestions
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => setShowRecipes(false)}
              sx={{ marginBottom: 2 }}
            >
              Back to Inventory
            </Button>
            <Stack spacing={2} width="100%" maxWidth="900px">
              {currentRecipes.length === 0 ? (
                <Typography>No recipes found</Typography>
              ) : (
                currentRecipes.map((recipe) => (
                  <Card key={recipe.id} sx={{ display: 'flex', marginBottom: 2 }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 100, height: 100 }}
                      image={recipe.image}
                      alt={recipe.title}
                    />
                    <CardContent sx={{ flex: '1 0 auto' }}>
                      <Typography variant="h6" sx={{ color: 'black' }}>
                        {recipe.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recipe.summary}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
              <Pagination
                count={Math.ceil(recipes.length / recipesPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}
              />
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  )
}
