import { Stack } from "expo-router";

export default function addExpenseLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />     
            <Stack.Screen name="camera" options={{ headerShown: false }} />
            <Stack.Screen name="receiptprocessone" options={{ headerShown: false }} />
            <Stack.Screen name="receiptprocesstwo" options={{ headerShown: false }} />

            <Stack.Screen name="photooption" options={{ headerShown: false }} />
            <Stack.Screen name="manuallyAdd" options={{ headerShown: false  }} />

        </Stack>
    )
}