<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />

	<!-- 
		Transform has two main steps:

		The global variables organises the job data by pairing up matching
		payload and template fields, collecting payload fields with @query but
		no matching template field and sorting subrecords and repeated fields 
		into repeating groups. 

		The root template then filters required fields and transforms this information 
		ready for interpretation by Rhinoforms/IM, as well as passing the existing 
		payload and job details through untouched.
	-->
	<xsl:variable name="repeatFields">
		<xsl:for-each select="//ifl//field[starts-with(name,'!repeat(')]/name">
			<key><xsl:value-of select="replace(., '!repeat\(|\)', '')"/></key>
		</xsl:for-each>
	</xsl:variable>
	<xsl:variable name="templateFields">
		<xsl:for-each select="//ifl//field[not(starts-with(name, '!'))]">
			<xsl:call-template name="collectTemplateFields">
				<xsl:with-param name="tField" select="."/>
			</xsl:call-template>
		</xsl:for-each>
	</xsl:variable>
	<xsl:variable name="payloadFields">
		<xsl:copy-of select="/merge/payload//data/record[1]/*"/>
	</xsl:variable>
	<xsl:variable name="combinedFields">
		<xsl:apply-templates select="$templateFields/templateField"/>
	</xsl:variable>
	<xsl:variable name="payloadOnlyFields">
		<xsl:call-template name="getPayloadOnlyFields"/>
	</xsl:variable>

	<xsl:template match="/">
		<merge xmlns="">
			<xsl:copy-of select="/merge/jobId"/>
			<xsl:copy-of select="/merge/jobDetails"/>
			<interactive>
				<xsl:copy-of select="/merge/payload//template"/>
				<xsl:apply-templates select="/merge/payload//destinations"/>
				<data>
					<record>
						<xsl:apply-templates select="$combinedFields/mergeField|$payloadOnlyFields/mergeField"/>
						<xsl:for-each select="$repeatFields/key">
							<xsl:variable name="currentKey" select="."/>
							<xsl:call-template name="createRepeatSets">
								<xsl:with-param name="repeatGroup">
									<xsl:copy-of select="$combinedFields/repeat[@subrecord=$currentKey]|$payloadOnlyFields/repeat[@subrecord=$currentKey]"/>
								</xsl:with-param>
							</xsl:call-template>
						</xsl:for-each>
					</record>
				</data>
			</interactive>
			<xsl:copy-of select="/merge/payload"/>
		</merge>
	</xsl:template>

	<xsl:template match="destinations">
		<destinations>
			<xsl:for-each select="*">
				<destination>
					<xsl:attribute name="name">
						<xsl:value-of select="name()"/>
					</xsl:attribute>
					<xsl:for-each select="*">
						<xsl:element name="parameter">
							<xsl:attribute name="name">
								<xsl:value-of select="name()"/>
							</xsl:attribute>
							<xsl:value-of select="."/>
						</xsl:element>
					</xsl:for-each>
				</destination>
			</xsl:for-each>
		</destinations>
	</xsl:template>

	<xsl:template name="collectTemplateFields">
		<xsl:param name="tField"/>
		<xsl:variable name="repeatKey" select="$repeatFields/key[.=substring-before($tField/name, '.')]"/>
		<xsl:choose>
			<xsl:when test="$repeatKey != ''">
				<templateField>
					<xsl:attribute name="repeat"><xsl:value-of select="$repeatKey"/></xsl:attribute>
					<name><xsl:value-of select="substring-after($tField/name, concat($repeatKey , '.'))"/></name>
					<xsl:copy-of select="$tField/*[name()!='name']"/>
				</templateField>
			</xsl:when>
			<xsl:otherwise>
				<templateField>
					<xsl:copy-of select="$tField/*"/>
				</templateField>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="templateField">
		<xsl:variable name="fieldName" select="name"/>
		<xsl:variable name="repeatName" select="@repeat"/>
		<xsl:choose>
			<xsl:when test="not(@repeat)">
				<xsl:call-template name="mergeField">
					<xsl:with-param name="templateField">
						<xsl:copy-of select="./*"/>
					</xsl:with-param>
					<xsl:with-param name="payloadField">
						<xsl:copy-of select="$payloadFields/field[@name=$fieldName or ends-with(@name, concat('.', $fieldName))]"/>
					</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<repeat>
					<xsl:attribute name="subrecord">
						<xsl:value-of select="$repeatName"/>
					</xsl:attribute>
					<xsl:attribute name="name">
						<xsl:value-of select="name"/>
					</xsl:attribute>
					<xsl:variable name="currentTField" select="."/>
					<xsl:for-each select="$payloadFields/subrecord[@name=$repeatName]">
						<xsl:call-template name="mergeField">
							<xsl:with-param name="index">
								<xsl:value-of select="@index"/>
							</xsl:with-param>
							<xsl:with-param name="templateField">
								<xsl:copy-of select="$currentTField/*"/>
							</xsl:with-param>
							<xsl:with-param name="payloadField">
								<xsl:copy-of select="field[@name=$fieldName or ends-with(@name, concat('.', $fieldName))]"/>
							</xsl:with-param>
						</xsl:call-template>
					</xsl:for-each>
				</repeat>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="mergeField">
		<xsl:param name="index" select="''"/>
		<xsl:param name="templateField" select="''"/>
		<xsl:param name="payloadField"/>
		<mergeField>
			<xsl:if test="$index!=''">
				<xsl:attribute name="subrecordIndex"><xsl:value-of select="$index"/></xsl:attribute>
			</xsl:if>
			<templateField>
				<xsl:copy-of select="$templateField"/>
			</templateField>
			<payloadField>
				<xsl:copy-of select="$payloadField/field/@*"/>
				<xsl:value-of select="$payloadField/field"/>
			</payloadField>
		</mergeField>
	</xsl:template>

	<xsl:template name="getPayloadOnlyFields">
		<xsl:for-each select="$payloadFields/field[@query]">
			<xsl:call-template name="getUnmatchedField">
				<xsl:with-param name="payloadField">
					<xsl:copy-of select="."/>
				</xsl:with-param>
				<xsl:with-param name="fieldsToCheck">
					<xsl:copy-of select="$combinedFields/mergeField"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:for-each>
		<xsl:for-each select="$payloadFields/subrecord">
			<xsl:variable name="subrecordName" select="@name"/>
			<xsl:variable name="subrecordIndex" select="@index"/>
			<repeat>
				<xsl:attribute name="subrecord"><xsl:value-of select="$subrecordName"/></xsl:attribute>
				<xsl:for-each select="field[@query]">
					<xsl:call-template name="getUnmatchedField">
						<xsl:with-param name="payloadField">
							<xsl:copy-of select="."/>
						</xsl:with-param>
						<xsl:with-param name="index">
							<xsl:value-of select="$subrecordIndex"/>
						</xsl:with-param>
						<xsl:with-param name="fieldsToCheck">
							<xsl:copy-of select="$combinedFields/repeat[@subrecord=$subrecordName]/mergeField[@subrecordIndex=$subrecordIndex]"/>
						</xsl:with-param>
					</xsl:call-template>
				</xsl:for-each>
			</repeat>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="getUnmatchedField">
		<xsl:param name="payloadField"/>
		<xsl:param name="fieldsToCheck"/>
		<xsl:param name="index" select="''"/>
		<xsl:variable name="fieldName" select="$payloadField/field/@name"/>
		<xsl:if test="not($fieldsToCheck/mergeField/payloadField[@name=$fieldName])">
			<xsl:call-template name="mergeField">
				<xsl:with-param name="index">
					<xsl:value-of select="$index"/>
				</xsl:with-param>
				<xsl:with-param name="payloadField">
					<xsl:copy-of select="$payloadField"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>

	<xsl:template name="createRepeatSets">
		<xsl:param name="repeatGroup"/>
		<xsl:for-each select="$repeatGroup/repeat[1]/mergeField">
			<xsl:variable name="subIndex" select="@subrecordIndex"/>
			<subrecord>
				<xsl:attribute name="name">
					<xsl:value-of select="$repeatGroup/repeat[1]/@subrecord"/>
				</xsl:attribute>
				<xsl:attribute name="index">
					<xsl:value-of select="$subIndex"/>
				</xsl:attribute>
				<xsl:apply-templates select="$repeatGroup/repeat/mergeField[@subrecordIndex=$subIndex]"/>
			</subrecord>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="mergeField">
		<xsl:if test="templateField/query!='' or payloadField/@query!='' or (templateField/mandatory='true' and payloadField='')">
			<xsl:variable name="label">
				<xsl:choose>
					<xsl:when test="payloadField/@query">
						<xsl:value-of select="payloadField/@query"/>
					</xsl:when>
					<xsl:when test="templateField/query">
						<xsl:value-of select="templateField/query"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="templateField/name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="type">
				<xsl:choose>
					<xsl:when test="templateField/type">
						<xsl:value-of select="substring-before(concat(templateField/type, '-'), '-')"/>
					</xsl:when>
					<xsl:otherwise>text</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="name">
				<xsl:choose>
					<xsl:when test="templateField/name">
						<xsl:value-of select="templateField/name"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="payloadField/@name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<field>
				<xsl:attribute name="label"><xsl:value-of select="$label"/></xsl:attribute>
				<xsl:attribute name="type"><xsl:value-of select="$type"/></xsl:attribute>
				<xsl:attribute name="mandatory">
					<xsl:value-of select="templateField/mandatory = 'true'"/>
				</xsl:attribute>
				<xsl:attribute name="format">
					<xsl:value-of select="substring-after(templateField/type, '-')"/>
				</xsl:attribute>
				<xsl:attribute name="templateName">
					<xsl:value-of select="templateField/name"/>
				</xsl:attribute>
				<xsl:attribute name="payloadName">
					<xsl:value-of select="payloadField/@name"/>
				</xsl:attribute>
				<xsl:element name="{replace($name, '[:\.]', '-')}">
					<xsl:call-template name="replace">
						<xsl:with-param name="string" select="payloadField"/>
						<xsl:with-param name="search" select='"&apos;"'/>
						<xsl:with-param name="replace" select='"\&apos;"'/>
					</xsl:call-template>
				</xsl:element>
			</field>
		</xsl:if>
	</xsl:template>

	<xsl:template name="replace">
		<xsl:param name="string"/>
		<xsl:param name="search"/>
		<xsl:param name="replace"/>
		<xsl:choose>
			<xsl:when test="contains($string, $search)">
				<xsl:value-of select="substring-before($string, $search)"/>
				<xsl:value-of select="$replace"/>
				<xsl:call-template name="replace">
					<xsl:with-param name="string" select="substring-after($string, $search)"/>
					<xsl:with-param name="search" select="$search"/>
					<xsl:with-param name="replace" select="$replace"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$string"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>