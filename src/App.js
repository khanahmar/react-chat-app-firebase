import { Box, Button, Container, HStack, Input, VStack } from "@chakra-ui/react"
import Message from "./Message"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth"
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore"
import React from "react"

import { app } from "./firebase"
import { async } from "@firebase/util"

const auth = getAuth(app)
const db = getFirestore(app)

const loginHandler = () => {
  const provider = new GoogleAuthProvider()
  signInWithPopup(auth, provider)
}

const logoutHandler = () => signOut(auth)

function App() {
  const [user, setUser] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [messages, setMessages] = React.useState([])
  const divForScroll = React.useRef(null)

  const submitHandler = async (e) => {
    e.preventDefault()
    try {
      setMessage("")
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      })

      divForScroll.current.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      alert(error)
    }
  }

  React.useEffect(() => {
    const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"))

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data)
    })

    const unsubscribeForMessage = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id
          return { id, ...item.data() }
        })
      )
    })

    return () => {
      unsubscribe()
      unsubscribeForMessage()
    }
  }, [])

  return (
    <Box bg={"red.50"}>
      {user ? (
        <Container h={"100vh"} bg={"white"}>
          <VStack paddingY={"4"} h={"full"}>
            <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
              Log out
            </Button>
            <VStack overflowY={"auto"} h={"full"} w={"full"}>
              {/* Message Component */}
              {messages.map((msg) => {
                return (
                  <Message
                    key={msg.id}
                    text={msg.text}
                    uri={msg.uri}
                    user={msg.uid === user.uid ? "me" : "other"}
                  />
                )
              })}
              <div ref={divForScroll}></div>
            </VStack>
            <form style={{ width: "100%" }}>
              <HStack>
                <Input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Enter a message"
                />
                <Button
                  onClick={submitHandler}
                  colorScheme={"purple"}
                  type={"submit"}
                >
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack
          backgroundColor={"gray.400"}
          height={"100vh"}
          justifyContent={"center"}
        >
          <Button onClick={loginHandler}>Sign with google</Button>
        </VStack>
      )}
    </Box>
  )
}

export default App
