import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
  },
});