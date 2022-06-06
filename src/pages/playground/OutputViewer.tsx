import type { RunnerEvent } from "../../services/workers/runner";

export interface Output {
    date: Date;
    events?: RunnerEvent[];
}

interface OutputViewerProps {
    outputs: Output[];
    loading?: boolean;
    onClear?: () => void;
    primaryPaneSize?: number;
}

export const OutputViewer: React.FC<OutputViewerProps> = ({ primaryPaneSize, outputs, loading, onClear }) => {
    return null; /**(
        <Flex
            className="dblayout-layout-main"
            direction="column"
            pos="relative"
            maxWidth="100%"
            height="100%"
            overflow="auto"
        >
            <Alert flexGrow={0} flexShrink={0} status="warning" p={2} pt={{ base: 6, md: 2 }}>
                <Text fontSize=".8rem" textAlign="left">
                    <strong>Heads up!</strong> This playground runs against your&nbsp;<code>main</code>&nbsp;branch that
                    likely contains <strong>real, live, production data</strong>. Be careful.
                </Text>
            </Alert>
            {outputs.length === 0 ? (
                <Flex p={8} fontSize="1rem" height="100%" textAlign="center" direction="column" gap={8}>
                    <XataLoader loading={Boolean(loading)} />
                    <Text fontSize="1rem">
                        Xata provides <strong>frictionless developer experience</strong> through this predictable and
                        type-safe SDK playground. Use the pane on the left to test out your queries. When you&rsquo;re
                        happy with a query, you can use it in your project by following these steps:
                    </Text>
                    <OrderedList maxWidth="fit-content" mx="auto" textAlign="left">
                        <li>Copy the code</li>
                        <li>Paste it in your project</li>
                        <li>
                            Use{" "}
                            <Code>
                                <Link href="https://github.com/xataio/client-ts">@xata.io/codegen</Link>
                            </Code>{" "}
                            in your project to generate the right types.
                        </li>
                    </OrderedList>
                    <Text fontSize="1rem">
                        From here, everything should work as expected.
                        <br />
                        If it doesn&rsquo;t, please use the{" "}
                        <span className={styles.feedbackButtonHint} id="feedback-button-text-hint">
                            feedback button
                        </span>{" "}
                        on this page.
                        <div className={styles.feedbackButtonArrow}>
                            <Arrow
                                key={primaryPaneSize}
                                startElementId="feedback-button-text-hint"
                                endElementId="feedback-button"
                            />
                        </div>
                    </Text>
                </Flex>
            ) : (
                <>
                    <Flex
                        alignItems="center"
                        w="100%"
                        px={4}
                        py={2}
                        bg={colorMode === "dark" ? "gray.900" : undefined}
                        bgGradient={colorMode === "dark" ? undefined : "linear-gradient(to-b, white 70%, gray.50)"}
                    >
                        <Flex alignItems="center" gap={2} ml={{ base: 0, md: "auto" }}>
                            <Button onClick={onClear} size="xs">
                                Clear
                            </Button>
                        </Flex>
                    </Flex>
                    <Flex direction="column" gap={4} p={4} pl={{ base: 4, md: 12 }}>
                        {outputs.map(({ date, events }, index) => (
                            <details open={index === 0} key={`output-${index}`}>
                                <summary style={{ cursor: "pointer" }} className={styles.summary}>
                                    <Text fontWeight="bold" display="inline-block" ml={1}>
                                        Result at {date.toLocaleString()}
                                    </Text>
                                </summary>
                                <div>
                                    {events?.map((log, i) => {
                                        const text = prettier.format(JSON.stringify(log.extra), {
                                            parser: "json",
                                            plugins: [parserJson],
                                            printWidth: 25,
                                        });

                                        return (
                                            <Flex direction="column" gap={2} key={`output-event-${index}-${i}`}>
                                                <Text
                                                    color={
                                                        log.type.includes("error")
                                                            ? "red.300"
                                                            : colorMode === "dark"
                                                            ? "white"
                                                            : "black"
                                                    }
                                                    fontFamily="monospace"
                                                    fontSize="small"
                                                >
                                                    {log.type}
                                                </Text>
                                                {log.extra && (
                                                    <Box position="relative">
                                                        <Snippet language="json">{text}</Snippet>
                                                        <CopyButton
                                                            position="absolute"
                                                            top={2}
                                                            right={2}
                                                            background={colorMode === "dark" ? "gray.700" : "white"}
                                                            text={text}
                                                        />
                                                    </Box>
                                                )}
                                            </Flex>
                                        );
                                    })}
                                </div>
                            </details>
                        ))}
                    </Flex>
                </>
            )}
        </Flex>
    );**/
};
